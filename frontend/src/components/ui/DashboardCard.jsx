import React from 'react';

/**
 * Reusable layout container for cohesive dashboard sections.
 */
export const DashboardCard = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-card border border-slate-200 transition-shadow duration-300 hover:shadow-card-hover ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};
