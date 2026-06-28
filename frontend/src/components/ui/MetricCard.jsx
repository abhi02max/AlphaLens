import React from 'react';
import { Info } from 'lucide-react';
import { useAppStore } from '../../store';

/**
 * Displays a single financial metric with optional beginner explanation.
 */
export const MetricCard = ({ label, value, explanation, isPositive = null }) => {
  const { learningMode } = useAppStore();
  const isBeginner = learningMode === 'beginner';

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {isBeginner && explanation && (
          <div className="group relative flex items-center">
            <Info size={14} className="text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {explanation}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          </div>
        )}
      </div>
      <div className={`text-xl font-bold ${
        isPositive === true ? 'text-fintech-green' : 
        isPositive === false ? 'text-fintech-red' : 'text-slate-800'
      }`}>
        {value}
      </div>
    </div>
  );
};
