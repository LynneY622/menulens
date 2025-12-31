
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { MenuItem, DishDetail, Recommendation, UserPreferences, GroundingSource, MenuAnalysisResult } from "./types";

const getApiKey = (): string => process.env.API_KEY || "";

const cleanGeminiJson = (text: string): string => {
  if (!text) return "";
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
};

export const parseMenuImage = async (base64Image: string): Promise<MenuAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType, data: cleanBase64 } },
        { text: "Extract restaurant name and all items. Provide appetizing Chinese translations, descriptions, prices, and dietary tags. Return strict JSON." }
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
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["originalName", "translatedName", "translatedDescription", "description"]
            }
          }
        },
        required: ["restaurantName", "items"]
      }
    }
  });

  return JSON.parse(cleanGeminiJson(response.text || "{}")) as MenuAnalysisResult;
};

export const searchDishInfo = async (dishName: string, restaurantName?: string, location?: string): Promise<DishDetail> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const context = restaurantName ? ` at ${restaurantName} ${location || ""}` : "";

  // Gemini 3 Flash for search grounding
  const searchPromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find details for: ${dishName}${context}. Summarize in Chinese (taste, ingredients, background).`,
    config: { tools: [{ googleSearch: {} }] }
  });

  // Gemini 2.5 Flash Image for high quality visualization
  const imagePromise = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: `A professional food photography shot of ${dishName}${context}.` }] }
  });

  const [searchRes, imgRes] = await Promise.allSettled([searchPromise, imagePromise]);

  let summary = "暂无详细介绍。";
  let sources: GroundingSource[] = [];
  if (searchRes.status === "fulfilled") {
    summary = searchRes.value.text || summary;
    const chunks = searchRes.value.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      sources = chunks.filter((c: any) => c.web).map((c: any) => ({
        title: c.web.title || "Source",
        uri: c.web.uri || "#"
      }));
    }
  }

  let generatedImage: string | undefined;
  if (imgRes.status === "fulfilled") {
    const part = imgRes.value.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) generatedImage = part.inlineData.data;
  }

  return { dishName, summary, imageLinks: sources, generatedImage };
};

export const getRecommendations = async (menu: MenuItem[], prefs: UserPreferences): Promise<Recommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const menuStr = menu.map(m => m.originalName).join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on menu [${menuStr}] and preferences [${JSON.stringify(prefs)}], recommend 3 dishes with Chinese reasons.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { dishName: { type: Type.STRING }, reason: { type: Type.STRING } },
          required: ["dishName", "reason"]
        }
      }
    }
  });
  return JSON.parse(cleanGeminiJson(response.text || "[]")) as Recommendation[];
};

export const createWaiterChat = (menu: MenuItem[]): Chat => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const menuContext = menu.map(m => `${m.originalName}: ${m.price}`).join("\n");
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are an AI waiter. Help guest with menu: ${menuContext}. Answer in Chinese or English.`
    }
  });
};
