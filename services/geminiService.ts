import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-3-flash-preview";

export const analyzeInventoryHealth = async (items: InventoryItem[]): Promise<string> => {
  try {
    const dataSummary = items.map(i => `${i.name} (${i.quantity} units, $${i.price}, Status: ${i.status})`).join('\n');
    
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

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate AI insights. Please check your API key.";
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
        const response = await ai.models.generateContent({
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
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error("Restock Plan Error", e);
        return [];
    }
}
