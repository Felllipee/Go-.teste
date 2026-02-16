
import { GoogleGenAI, Type } from "@google/genai";

// Inicialização segura
const getAI = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const suggestAlias = async (url: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira 3 nomes curtos (aliases) criativos e cativantes no estilo Netflix (como 'serie-vicio', 'pipoca-play', 'spoiler-link') para o seguinte URL: ${url}. Retorne apenas um array JSON de strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Erro ao sugerir alias:", error);
    return ["link-vip", "play-agora", "acesso-premium"];
  }
};

export const analyzeLinkMetadata = async (url: string): Promise<{ title: string; category: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise este URL: ${url}. 
      1. Crie um título cinematográfico impactante (máx 25 chars).
      2. Atribua um gênero de "streaming" (Ex: Ação, Drama, Documentário, Comédia, Suspense, Sci-Fi).
      Retorne em JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["title", "category"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { title: "Novo Lançamento", category: "Originais" };
  }
};
