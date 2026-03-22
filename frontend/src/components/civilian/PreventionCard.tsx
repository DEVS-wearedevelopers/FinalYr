import React from 'react';

interface PreventionCardProps {
  title: string;
  tip: string;
  icon?: React.ReactNode;
}

export function PreventionCard({ title, tip, icon }: PreventionCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[#1e52f1]">
          {icon}
        </div>
      )}
      <div>
        <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
        <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
