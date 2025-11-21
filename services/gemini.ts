import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ClothingItem, Recommendation, AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Auto-Classify Clothing (Vision)
export const analyzeClothingImage = async (base64Image: string): Promise<AnalysisResult> => {
  // Remove header from base64 string if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg', // Assuming JPEG from our resize util
            data: base64Data
          }
        },
        {
          text: `Analyze this clothing item. Provide a JSON object with:
          - name: A short descriptive name (e.g. "Blue Denim Jacket").
          - insulation: An integer 1-10 where 1 is a thin t-shirt/tank top and 10 is a heavy winter expedition parka.
          - tags: An array of 3-5 keywords describing style, material, and usage.
          - color: The primary color.`
        }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          insulation: { type: Type.INTEGER },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          color: { type: Type.STRING }
        },
        required: ['name', 'insulation', 'tags', 'color']
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as AnalysisResult;
  }
  throw new Error("Failed to analyze image");
};

// 2. Get Weather (Search Grounding)
// Step 1: Get raw weather text and sources
const fetchWeatherText = async (location: string): Promise<{ text: string; sources: string[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    // Adding current date helps the model search for relevant current info
    contents: `Today is ${new Date().toDateString()}. What is the current temperature and weather condition in ${location}? Be specific.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const text = response.text || "Weather information unavailable.";
  
  // Extract sources from grounding metadata
  const sources: string[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push(chunk.web.uri);
      }
    });
  }

  return { text, sources: Array.from(new Set(sources)) };
};

// 3. Generate Recommendation (Reasoning)
// Step 2: Process weather text + Wardrobe -> Recommendation
export const getRecommendation = async (location: string, wardrobe: ClothingItem[]): Promise<Recommendation> => {
  const { text: weatherText, sources } = await fetchWeatherText(location);

  // Minimize token usage by sending a simplified wardrobe list
  const simplifiedWardrobe = wardrobe.map(item => ({
    id: item.id,
    name: item.name,
    insulation: item.insulation,
    tags: item.tags
  }));

  const prompt = `
    Context:
    Current Weather in ${location}: "${weatherText}"
    
    User's Wardrobe (JSON):
    ${JSON.stringify(simplifiedWardrobe)}

    Task:
    1. Determine if it is "sweater weather" (generally below 20°C/68°F but above 10°C/50°F, or just chilly enough for layers).
    2. Select the best combination of items from the wardrobe for this weather. You can select multiple items for layering.
    3. Provide a reasoning summary.
    4. Extract the temperature and short summary from the weather text.

    Output JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weather: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              temperature: { type: Type.STRING },
              isSweaterWeather: { type: Type.BOOLEAN },
              location: { type: Type.STRING }
            }
          },
          selectedItemIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          reasoning: { type: Type.STRING }
        }
      }
    }
  });

  if (response.text) {
    const result = JSON.parse(response.text);
    // Ensure location is passed through if model forgets to set it correctly from context
    result.weather.location = location;
    // Inject sources from the first step
    result.weather.sources = sources;
    return result as Recommendation;
  }
  throw new Error("Failed to generate recommendation");
};