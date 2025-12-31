export interface MenuItem {
  originalName: string;
  translatedName: string;
  description: string;
  translatedDescription: string;
  price?: string;
  category?: string;
  tags?: string[]; // e.g., ["Vegetarian", "Spicy", "Contains Nuts"]
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DishDetail {
  dishName: string;
  summary: string;
  imageLinks: GroundingSource[];
  generatedImage?: string; // Base64 string of the generated image
  realImageUrl?: string;
}

export interface Recommendation {
  dishName: string;
  reason: string;
}

export interface UserPreferences {
  spicyLevel: string;
  partySize: number;
  dietaryRestrictions: string;
  favorites: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MenuAnalysisResult {
  restaurantName: string;
  items: MenuItem[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING_MENU = 'PROCESSING_MENU',
  MENU_VIEW = 'MENU_VIEW',
  RECOMMENDATION_VIEW = 'RECOMMENDATION_VIEW'
}

export enum SpicyLevel {
  NONE = 'No Spice',
  MILD = 'Mild',
  MEDIUM = 'Medium',
  HOT = 'Hot',
  EXTREME = 'Extreme'
}