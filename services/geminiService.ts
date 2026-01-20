import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-3-flash-preview";

// Helper to implement timeout
const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

export const analyzeInventoryHealth = async (items: InventoryItem[]): Promise<string> => {
  try {
    const dataSummary = items.map(i => `${i.name} (${i.quantity} units, $${i.price}, Status: ${i.status})`).join('\n');
    
    if (items.length === 0) {
        return "Inventory is empty. Add items to generate insights.";
    }

    const prompt = `
      Analyze the following inventory data and provide a concise strategic summary (max 300 words).
      Focus on:
      1. Potential revenue risks (low stock).
      2. Overstocking issues.
      3. Pricing anomalies or suggestions.
      4. Overall health score (0-100).

      Inventory Data:
      ${dataSummary}
      
      Format with clear headings. Use Markdown.
    `;

    // Race the API call against a 15-second timeout
    const result: any = await Promise.race([
        ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }, 
            }
        }),
        timeout(15000)
    ]);

    return result.text || "No analysis generated.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message === 'Request timed out') {
        return "Analysis timed out. The server is taking too long to respond. Please try again.";
    }
    return "Failed to generate AI insights. Please check your API key or internet connection.";
  }
};

export const suggestRestockPlan = async (items: InventoryItem[]): Promise<{ item: string; suggestion: string }[]> => {
    // Filter for items that need attention to save tokens
    const criticalItems = items.filter(i => i.quantity < 20 || i.status === 'Low Stock');
    
    if (criticalItems.length === 0) return [];

    const prompt = `
      For the following critical inventory items, suggest a restock strategy.
      Return a JSON array where each object has "item" (name) and "suggestion" (short action plan).
      
      Items:
      ${JSON.stringify(criticalItems.map(i => ({ name: i.name, quantity: i.quantity, salesVelocity: 'Unknown' })))}
    `;

    try {
        const response: any = await Promise.race([
            ai.models.generateContent({
                model: modelName,
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
        ]);

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error("Restock Plan Error", e);
        return []; // Fail silently for secondary features
    }
}