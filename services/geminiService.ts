import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InventoryItem } from "../types.ts";

const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

/**
 * Mendapatkan instance AI secara dinamis (Lazy Initialization).
 * Mencegah crash fatal saat startup jika API_KEY belum tersedia.
 * Menggunakan fallback ke window.process untuk keamanan runtime.
 */
const getAIInstance = () => {
  // Ambil key dari process.env (Node/Vite) atau window.process (Shim browser)
  const env = (typeof process !== 'undefined' ? process.env : {}) as any;
  const win = (typeof window !== 'undefined' ? (window as any).process?.env : {}) as any;
  
  const apiKey = env.API_KEY || win.API_KEY || '';
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeInventoryHealth = async (items: InventoryItem[]): Promise<string> => {
  try {
    // Instance dibuat HANYA saat fungsi dipanggil
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
      return "⚠️ AI Insight tidak tersedia.\n\nAPI Key belum dikonfigurasi. Silakan tambahkan 'API_KEY' di environment variables Vercel Anda.";
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
    } catch (e: any) {
        console.error("Restock Plan Error", e);
        if (e.message === "API_KEY_MISSING") return [];
        return [];
    }
};