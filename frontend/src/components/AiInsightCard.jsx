import React from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Info, CheckCircle2, Target } from 'lucide-react';
import { useAiInsights } from '../hooks/useStocks';
import { AiInsightSkeleton } from './SkeletonLoader';
import { DashboardCard } from './ui/DashboardCard';

const AiInsightCard = ({ symbol }) => {
  const { data: insights, isLoading, isError } = useAiInsights(symbol);

  if (isLoading) return <AiInsightSkeleton />;
  
  if (isError) {
    return (
      <DashboardCard className="bg-red-50 border-red-100 flex items-start gap-3">
        <AlertTriangle className="text-red-500 shrink-0 mt-1" size={20} />
        <div>
          <h4 className="text-red-800 font-semibold mb-1">AI Engine Unavailable</h4>
          <p className="text-red-600 text-sm">We couldn't generate insights for {symbol} at this time. Please try again later.</p>
        </div>
      </DashboardCard>
    );
  }

  if (!insights || !insights.summary) return null;

  return (
    <DashboardCard className="bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700 text-white relative overflow-hidden h-full flex flex-col">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-400" size={20} />
          <h3 className="text-lg font-bold text-white tracking-wide">AlphaLens Analysis</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
          <Target size={12} className="text-green-400" />
          <span>High Confidence</span>
        </div>
      </div>

      <div className="relative z-10 flex-1">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
            <CheckCircle2 size={16} className="text-blue-400" /> Key Takeaway
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {insights.summary}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-400" /> Potential Concern
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {insights.reason || "Short-term volatility may present buying opportunities or immediate risk."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Risk Level</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              insights.risk === 'High' ? 'bg-red-500' : 
              insights.risk === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
            }`} />
            <span className="font-semibold text-sm">{insights.risk}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Sentiment</span>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className={
              insights.sentiment === 'Bullish' ? 'text-green-400' : 'text-slate-400'
            } />
            <span className="font-semibold text-sm">{insights.sentiment}</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default AiInsightCard;
