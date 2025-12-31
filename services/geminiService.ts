import { GoogleGenAI, Type, Chat } from "@google/genai";
import { MenuItem, DishDetail, Recommendation, UserPreferences, GroundingSource, MenuAnalysisResult } from "../types";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing from environment");
    return "";
  }
  return key;
};

// Helper to clean Markdown code blocks from JSON string
const cleanGeminiJson = (text: string): string => {
  if (!text) return "";
  // Remove ```json ... ``` or just ``` ... ``` wrappers
  // The regex covers starting ```json or ```, and ending ```
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
};

// 1. Parse Menu Image
export const parseMenuImage = async (base64Image: string): Promise<MenuAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Extract MIME type dynamically
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"; // Default to jpeg if not found

  // Clean base64 string - remove ANY data url header
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: `You are an expert menu parser for Chinese diners. Analyze this menu image.

            Tasks:
            1. **Restaurant Name**: Look for the largest text at the top or logo text. If not found, return "Unknown Restaurant".
            2. **Items**: Extract every single dish or drink listed.
            
            For each item, infer or extract:
            - "originalName": The exact text on the menu.
            - "translatedName": Natural, appetizing Chinese translation (e.g. "Kung Pao Chicken" -> "宫保鸡丁"). 
               * IMPORTANT: If the dish uses specific Western terms (e.g., "Biscuits", "Grits", "Hash", "Scone"), do NOT translate literally. Use the culturally understood Chinese term or add a brief explanation (e.g. "Biscuits" -> "美式松饼", "Grits" -> "玉米糊").
            - "description": The exact English description text found on the menu. If NO description text is visible, you MUST generate a short, specific English description based on the dish name.
            - "translatedDescription": A descriptive Chinese explanation of the ingredients and taste. 
               * DO NOT translate literally (e.g. don't say "served with" as "服务与", say "配有"). 
               * Make it sound delicious (appetizing language).
               * If the dish is obscure, explain what it is (e.g. "Fried cheese curds" -> "炸芝士凝乳 (类似炸芝士球)").
            - "price": e.g. "$12.99" or "12.99".
            - "category": Infer category (e.g. "Breakfast", "Mains").
            - "tags": ["Vegetarian", "Vegan", "Gluten-Free", "Spicy", "Contains Nuts", "Contains Pork", "Contains Seafood", "Contains Dairy", "Alcohol"].

            Return a strict JSON object matching the schema. Do not include markdown formatting.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            restaurantName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalName: { type: Type.STRING },
                  translatedName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  translatedDescription: { type: Type.STRING },
                  price: { type: Type.STRING },
                  category: { type: Type.STRING },
                  tags: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["originalName", "translatedName", "translatedDescription", "description"]
              }
            }
          },
          required: ["restaurantName", "items"]
        }
      }
    });

    const text = cleanGeminiJson(response.text || "");
    if (!text) return { restaurantName: "", items: [] };
    return JSON.parse(text) as MenuAnalysisResult;

  } catch (error) {
    console.error("Error parsing menu:", error);
    throw error; // Re-throw to be caught by App.tsx
  }
};

// 2. Search for Dish Info (Search Grounding + Image Generation)
export const searchDishInfo = async (dishName: string, restaurantName?: string, location?: string): Promise<DishDetail> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  let searchContext = `photos of "${dishName}"`;
  let restaurantContext = "";
  
  if (restaurantName && restaurantName !== "Unknown Restaurant") {
    restaurantContext = ` at "${restaurantName}"`;
    if (location) {
      restaurantContext += ` in ${location}`;
    }
  }
  
  const fullQuery = searchContext + restaurantContext;

  // Task A: Search for text info and links
  const searchPromise = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a helpful dining assistant for a Chinese speaker. Find details for: ${fullQuery}.

    Tasks:
    1. **Search**: Look for reviews, photos, or menu items.
    2. **Find Image**: Try to identify a direct URL to a photo.
    3. **Summarize**: Write a concise, helpful explanation in CHINESE (中文).
       - Explain what the dish consists of (ingredients).
       - Describe the flavor profile (salty, sweet, spicy, texture).
       - Mention any cultural context if relevant.
       - Keep it under 80 words.

    Return JSON format: { "summary": string, "realImageUrl": string | null }. Do not use markdown code blocks.`,
    config: {
      tools: [{ googleSearch: {} }],
      // responseMimeType is not allowed when using the googleSearch tool.
    }
  });

  // Task B: Generate an image visualization (fallback/alternative)
  const imagePromise = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: `A delicious, high-quality, professional food photography close-up shot of the dish "${dishName}"${restaurantContext}. Photorealistic, appetizing lighting, 4k resolution.` }
      ]
    }
  });

  try {
    // Run both in parallel for better UX
    const [searchResponse, imageResponse] = await Promise.allSettled([searchPromise, imagePromise]);

    // Process Search Results
    let summary = "暂无详细介绍 (No details found).";
    let realImageUrl: string | undefined = undefined;
    const sources: GroundingSource[] = [];

    if (searchResponse.status === "fulfilled") {
      const rawText = searchResponse.value.text || "{}";
      const cleanedText = cleanGeminiJson(rawText);

      try {
        const jsonRes = JSON.parse(cleanedText);
        summary = jsonRes.summary || "暂无详细介绍 (No details found).";
        
        if (jsonRes.realImageUrl && typeof jsonRes.realImageUrl === 'string' && jsonRes.realImageUrl.startsWith('http')) {
           realImageUrl = jsonRes.realImageUrl;
        }
      } catch (e) {
        // Fallback: If parsing fails, try to use the cleaned text if it's not looking like a JSON object
        // If it starts with {, it's likely broken JSON, so we try to extract summary or default.
        if (cleanedText.trim().startsWith('{')) {
             // Basic regex attempt to extract summary if JSON is broken
             const match = cleanedText.match(/"summary"\s*:\s*"([^"]+)"/);
             summary = match ? match[1] : (cleanedText || "Summary unavailable.");
        } else {
             // It's likely just plain text returned by the model ignoring JSON instructions
             summary = cleanedText || "Summary unavailable.";
        }
      }
      
      const chunks = searchResponse.value.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || "Source",
              uri: chunk.web.uri || "#"
            });
          }
        });
      }
    } else {
      console.error("Search failed:", searchResponse.reason);
    }

    // Process Image Generation Results
    let generatedImage: string | undefined = undefined;
    if (imageResponse.status === "fulfilled") {
      const parts = imageResponse.value.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImage = part.inlineData.data;
            break;
          }
        }
      }
    } else {
      console.error("Image generation failed:", imageResponse.reason);
    }

    // De-duplicate sources
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return {
      dishName,
      summary,
      imageLinks: uniqueSources.slice(0, 5), // Top 5 links
      generatedImage,
      realImageUrl
    };

  } catch (error) {
    console.error("Error searching/generating dish info:", error);
    return {
      dishName,
      summary: "Could not fetch details at this time.",
      imageLinks: []
    };
  }
};

// 3. Get Recommendations
export const getRecommendations = async (menu: MenuItem[], prefs: UserPreferences): Promise<Recommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // Simplify menu for token efficiency
  const simpleMenu = menu.map(m => `${m.originalName} (${m.translatedName}) - ${m.price} [Tags: ${m.tags?.join(',')}]`).join("\n");

  const prompt = `
    I am a Chinese diner at a restaurant. 
    Here is the menu:
    ${simpleMenu}

    My preferences are:
    - Party Size: ${prefs.partySize} people
    - Dietary Restrictions: ${prefs.dietaryRestrictions || "None"}
    - Spice Tolerance: ${prefs.spicyLevel}
    - Favorites/Cravings: ${prefs.favorites || "Anything good"}

    Recommend 3 best dishes for me based on my preferences. 
    Explain why in Chinese.
    The reason should be persuasive and describe the taste.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dishName: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["dishName", "reason"]
          }
        }
      }
    });

    const text = cleanGeminiJson(response.text || "");
    if (!text) return [];
    return JSON.parse(text) as Recommendation[];

  } catch (error) {
    console.error("Error getting recommendations:", error);
    throw new Error("Failed to get recommendations.");
  }
};

// 4. Initialize Waiter Chat
export const createWaiterChat = (menu: MenuItem[]): Chat => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const menuContext = menu.map(m => 
    `- ${m.originalName} (${m.translatedName}): ${m.price || 'Price unknown'}. Tags: [${m.tags?.join(', ') || ''}]. ${m.description}`
  ).join("\n");

  const systemInstruction = `
    You are a friendly, knowledgeable restaurant waiter. 
    The user is a diner looking at the following menu:
    
    ${menuContext}

    Your goal is to answer their questions about the menu, ingredients, flavors, or pricing.
    - If they ask for recommendations, suggest items from the list.
    - If they ask about currency, give an approximate conversion if you know the currency symbol, otherwise explain you are unsure.
    - Be concise and helpful. 
    - The user speaks Chinese and English. Reply in the language the user uses.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    }
  });
};