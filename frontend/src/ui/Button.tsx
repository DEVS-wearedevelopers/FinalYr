import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "bg-[#1e52f1] text-white hover:bg-[#123bb5] shadow-sm shadow-[#1e52f1]/20 focus:ring-[#1e52f1]",
        outline: "border-2 border-slate-200 text-slate-700 hover:border-[#1e52f1] hover:bg-slate-50 focus:ring-[#1e52f1]",
        ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-500",
    };

    const widthStyle = fullWidth ? 'w-full' : '';
    const paddingStyle = "px-6 py-3";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${widthStyle} ${paddingStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
