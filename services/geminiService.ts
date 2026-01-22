import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InventoryItem } from "../types.ts";

const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

/**
 * Mendapatkan instance AI secara dinamis.
 * Dipindah ke fungsi untuk mencegah crash top-level jika API_KEY kosong.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeInventoryHealth = async (items: InventoryItem[]): Promise<string> => {
  try {
    const ai = getAIInstance();
    const dataSummary = items.map(i => `${i.name} (${i.quantity} units, $${i.price}, Status: ${i.status})`).join('\n');
    
    if (items.length === 0) {
        return "Inventory kosong. Tambahkan item untuk analisis AI.";
    }

    const prompt = `
      Analisislah data inventaris berikut dan berikan ringkasan strategis yang ringkas (maks 300 kata).
      Fokus pada:
      1. Risiko pendapatan (stok rendah).
      2. Masalah stok berlebih.
      3. Saran atau anomali harga.
      4. Skor kesehatan keseluruhan (0-100).

      Inventory Data:
      ${dataSummary}
      
      Format dengan heading yang jelas dalam Markdown.
    `;

    const response = await Promise.race([
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }, 
            }
        }),
        timeout(15000)
    ]) as GenerateContentResponse;

    return response.text || "Tidak ada analisis yang dihasilkan.";
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") {
      return "AI Insight dinonaktifkan: API Key tidak ditemukan di environment.";
    }
    console.error("Gemini Analysis Error:", error);
    return `Gagal menghasilkan insight AI: ${error.message}`;
  }
};

export const suggestRestockPlan = async (items: InventoryItem[]): Promise<{ item: string; suggestion: string }[]> => {
    try {
        const ai = getAIInstance();
        const criticalItems = items.filter(i => i.quantity < 20 || i.status === 'Low Stock');
        if (criticalItems.length === 0) return [];

        const prompt = `
          Berikan strategi restock untuk item kritis berikut.
          Kembalikan array JSON dengan objek "item" (nama) dan "suggestion" (rencana aksi singkat).
          
          Items:
          ${JSON.stringify(criticalItems.map(i => ({ name: i.name, quantity: i.quantity })))}
        `;

        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                item: { type: Type.STRING },
                                suggestion: { type: Type.STRING }
                            },
                            required: ["item", "suggestion"]
                        }
                    }
                }
            }),
            timeout(10000)
        ]) as GenerateContentResponse;

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error("Restock Plan Error", e);
        return [];
    }
};