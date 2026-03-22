'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="relative min-h-screen bg-white flex flex-col items-center justify-center overflow-hidden px-6 font-sans">

            {/* Subtle grid doodle background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.035]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e52f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">

                {/* Animated 404 number */}
                <div
                    className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <p className="text-[120px] sm:text-[160px] font-black leading-none tracking-tighter select-none"
                        style={{ color: 'transparent', WebkitTextStroke: '2px #1e52f1', opacity: 0.12 }}>
                        404
                    </p>
                </div>

                {/* Icon */}
                <div className={`-mt-10 sm:-mt-16 mb-6 w-16 h-16 bg-[#1e52f1]/10 rounded-2xl flex items-center justify-center transition-all duration-700 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <svg className="w-8 h-8 text-[#1e52f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>

                {/* Text */}
                <div className={`space-y-2 mb-8 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Page not found
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Actions */}
                <div className={`flex flex-col sm:flex-row items-center gap-3 w-full transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                    <Link
                        href="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1e52f1] text-white text-sm font-semibold hover:bg-[#123bb5] transition-all shadow-lg shadow-[#1e52f1]/25 hover:shadow-xl hover:shadow-[#1e52f1]/30"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go home
                    </Link>
                    <Link
                        href="/login"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Sign in
                    </Link>
                </div>

                {/* MERMS branding */}
                <div className={`mt-12 flex items-center gap-2 text-slate-400 text-xs transition-all duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-5 h-5 bg-[#1e52f1] rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
                        </svg>
                    </div>
                    MERMS Platform
                </div>
            </div>
        </div>
    );
}
