
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.41.0";

const getAI = () => {
  // Fix: Direct initialization using process.env.API_KEY as per the @google/genai coding guidelines.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const suggestAlias = async (url: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira 3 nomes curtos e impactantes estilo Netflix para este URL: ${url}. Ex: pipoca-play, spoiler-link. Retorne apenas JSON ["a", "b", "c"].`,
      config: { responseMimeType: "application/json" }
    });
    // Fix: Access response.text as a property.
    return JSON.parse(response.text);
  } catch (error) {
    return ["play-agora", "acesso-premium", "link-vip"];
  }
};

export const analyzeLinkMetadata = async (url: string): Promise<{ title: string; category: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise este URL: ${url}. Crie um título de filme (max 25 chars) e um gênero de streaming. Retorne JSON {title, category}.`,
      config: { responseMimeType: "application/json" }
    });
    // Fix: Access response.text as a property.
    return JSON.parse(response.text);
  } catch (error) {
    return { title: "Lançamento Exclusivo", category: "Séries Originais" };
  }
};
