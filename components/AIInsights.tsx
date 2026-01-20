import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { analyzeInventoryHealth, suggestRestockPlan } from '../services/geminiService';
import { Bot, Sparkles, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  items: InventoryItem[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ items }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [restockPlan, setRestockPlan] = useState<{ item: string; suggestion: string }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const [healthAnalysis, restockSuggestions] = await Promise.all([
        analyzeInventoryHealth(items),
        suggestRestockPlan(items)
      ]);
      setAnalysis(healthAnalysis);
      setRestockPlan(restockSuggestions);
    } catch (error) {
      console.error("Error generating insights", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mb-4 border border-indigo-500/30">
            <Bot className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Strategic Advisor</h1>
        <p className="text-slate-400 mt-2 max-w-lg mx-auto">
          Leverage Gemini 3 Flash to analyze your stock levels, pricing strategies, and supply chain risks in real-time.
        </p>
      </div>

      {!analysis && !loading && (
        <div className="flex justify-center mt-12">
            <button 
                onClick={handleGenerateInsights}
                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                <span className="relative flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-700" />
                    Generate Strategic Report
                </span>
            </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
          <p className="text-indigo-300 animate-pulse">Analyzing inventory vectors...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="grid gap-6 animate-slide-up">
            {/* Main Analysis Card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8 glass-panel relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bot className="w-32 h-32 text-white" />
                 </div>
                 <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6 text-neon-teal" />
                    <h2 className="text-xl font-bold text-white">Strategic Health Assessment</h2>
                 </div>
                 <div className="prose prose-invert prose-indigo max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                 </div>
            </div>

            {/* Restock Recommendations */}
            {restockPlan && restockPlan.length > 0 && (
                <div className="bg-dark-card border border-dark-border rounded-2xl p-8 glass-panel">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="w-6 h-6 text-neon-orange" />
                        <h2 className="text-xl font-bold text-white">Critical Action Items</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {restockPlan.map((plan, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-dark-bg/50 border border-dark-border flex items-start gap-4 hover:border-neon-orange/50 transition-colors">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 mt-1">
                                    <Lightbulb className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">{plan.item}</h4>
                                    <p className="text-sm text-slate-400 mt-1">{plan.suggestion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center pt-6">
                <button 
                    onClick={handleGenerateInsights} 
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Analysis
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;