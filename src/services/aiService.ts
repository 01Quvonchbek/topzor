import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";

// Initialize with the environment key for general tasks
// For Pro/Image models, we will re-instantiate with process.env.API_KEY if needed,
// but the platform handles process.env.GEMINI_API_KEY for us.
const getAI = (apiKey?: string) => new GoogleGenAI({ apiKey: apiKey || (process.env.GEMINI_API_KEY as string) });

export const aiService = {
  // 1. AI Powered Chatbot (gemini-3.1-pro-preview)
  async askChatbot(message: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: message,
      config: {
        systemInstruction: "Siz SuperPlatform yordamchisiz. Foydalanuvchilarga e'lonlar, auksionlar va platforma xizmatlari haqida ma'lumot berasiz.",
      },
    });
    return response.text;
  },

  // 2. Google Search Grounding (gemini-3-flash-preview)
  async searchWithGrounding(query: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web).filter(Boolean) || [];
    
    return { text, sources };
  },

  // 3. Image Generation (gemini-3-pro-image-preview)
  async generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    // Note: This requires user-selected API key (process.env.API_KEY)
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  // 4. Nano Banana 2 - Image Edit/Create (gemini-3.1-flash-image-preview)
  async editOrCreateImage(prompt: string, base64Image?: string) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const parts: any[] = [{ text: prompt }];
    
    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image.split(',')[1] || base64Image,
          mimeType: "image/png",
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: { parts },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  // 5. Maps Grounding (gemini-2.5-flash)
  async searchNearby(query: string, location?: { lat: number; lng: number }) {
    const ai = getAI();
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config,
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.maps).filter(Boolean) || [];
    
    return { text, sources };
  },

  // 6. Live API (gemini-2.5-flash-native-audio-preview-09-2025)
  connectLive(callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (err: any) => void;
    onclose: () => void;
  }) {
    const ai = getAI();
    return ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: "Siz SuperPlatform ovozli yordamchisiz. Foydalanuvchi bilan samimiy suhbat qurasiz.",
      },
    });
  }
};
