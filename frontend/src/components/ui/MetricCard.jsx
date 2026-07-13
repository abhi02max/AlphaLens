import React from 'react';
export const MetricCard = ({ label, value, isPositive = null }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm font-medium text-slate-500">{label}</span>
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
