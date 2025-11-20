import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateNarrative = async (context: string): Promise<string> => {
  if (!ai) return "The winds of Aether are silent (API Key missing).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the Dungeon Master for a hack-and-slash game.
      Keep the response SHORT (under 20 words).
      Context: ${context}.
      Generate a dramatic, atmospheric, or taunting line.`,
    });
    return response.text || "The dungeon rumbles...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Darkness interferes with the prophecy.";
  }
};
