import React, { useState } from 'react';

interface AlertCardProps {
  title: string;
  description: string;
  date: string;
  advice: string;
}

export function AlertCard({ title, description, date, advice }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl p-5 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{date}</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">{description}</p>
      
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)} 
        className="text-sm font-semibold text-[#1e52f1] flex items-center gap-1 focus:outline-none transition-colors hover:text-[#123bb5]"
      >
        <span>{expanded ? 'Hide Advice' : 'View Action Steps'}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{advice}</p>
        </div>
      )}
    </div>
  );
}
