import React from 'react';

/**
 * Reusable loading skeleton framework for perceived performance.
 */
export const SkeletonBox = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
  );
};

export const SummarySkeleton = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start mb-6">
      <div>
        <SkeletonBox className="h-8 w-48 mb-2" />
        <SkeletonBox className="h-4 w-24" />
      </div>
      <div className="text-right">
        <SkeletonBox className="h-10 w-32 mb-2" />
        <SkeletonBox className="h-4 w-20 ml-auto" />
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <SkeletonBox className="h-3 w-16 mb-2" />
          <SkeletonBox className="h-5 w-24" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 h-[400px] flex items-end gap-2 pb-6">
    {Array.from({ length: 20 }).map((_, i) => (
      <SkeletonBox 
        key={i} 
        className="flex-1 rounded-t-sm" 
        style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
      />
    ))}
  </div>
);

export const AiInsightSkeleton = () => (
  <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6 rounded-2xl shadow-sm border border-emerald-100 mt-6">
    <div className="flex items-center gap-2 mb-4">
      <SkeletonBox className="h-6 w-6 rounded-full" />
      <SkeletonBox className="h-6 w-40" />
    </div>
    <SkeletonBox className="h-4 w-full mb-3" />
    <SkeletonBox className="h-4 w-11/12 mb-3" />
    <SkeletonBox className="h-4 w-4/5 mb-6" />
    
    <div className="flex gap-4">
      <SkeletonBox className="h-24 flex-1 rounded-lg" />
      <SkeletonBox className="h-24 flex-1 rounded-lg" />
    </div>
  </div>
);
