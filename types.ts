export interface ClothingItem {
  id: string;
  imageData: string; // Base64
  name: string;
  type: string; // e.g., 'Hoodie', 'T-Shirt'
  insulation: number; // 1-10
  tags: string[];
}

export interface WeatherInfo {
  summary: string;
  temperature: string;
  isSweaterWeather: boolean;
  location: string;
  sources?: string[];
}

export interface Recommendation {
  weather: WeatherInfo;
  selectedItemIds: string[];
  reasoning: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  WARDROBE = 'WARDROBE',
}

export interface AnalysisResult {
  insulation: number;
  tags: string[];
  name: string;
  color: string;
}