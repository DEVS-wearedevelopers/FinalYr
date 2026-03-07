import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full space-y-2 text-left">
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
                <div className="relative">
                    <input
                        id={inputId}
                        ref={ref}
                        className={`
              w-full px-4 py-3 rounded-xl border text-slate-900 placeholder:text-slate-400
              transition-all duration-200 bg-white
              focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]
              ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
