import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ icon: Icon, title, description, actionText, actionLink }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <Icon size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      
      {actionText && actionLink && (
        <Link 
          to={actionLink}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};
