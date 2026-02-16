
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.41.0";

const getAI = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const suggestAlias = async (url: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira 3 nomes curtos e impactantes estilo Netflix para este URL: ${url}. Ex: pipoca-play, spoiler-link. Retorne apenas JSON ["a", "b", "c"].`,
      config: { responseMimeType: "application/json" }
    });
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
    return JSON.parse(response.text);
  } catch (error) {
    return { title: "Lançamento Exclusivo", category: "Séries Originais" };
  }
};
