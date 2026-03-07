import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
    children: React.ReactNode;
    heading: string;
    subheading: string;
    imageAlt?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    heading,
    subheading
}) => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans text-slate-900">

            {/* Left Column (Brand/Graphic Side) */}
            <div className="relative hidden md:flex flex-col flex-1 bg-[#1e52f1] text-white overflow-hidden p-12 lg:p-24 justify-between">
                {/* Subtle Doodle Pattern Background */}
                <div
                    className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tighter">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#1e52f1]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
                            </svg>
                        </div>
                        Platform
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg mt-24 mb-auto">
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
                        The foundation for your next great idea.
                    </h1>
                    <p className="text-[#1e52f1] bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20 text-white/90 leading-relaxed">
                        "This structured approach has completely transformed how quickly we ship new features.
                        Highly modular UI makes phase 2 development effortless."
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30" />
                        <div>
                            <p className="font-semibold text-white">Alex Developer</p>
                            <p className="text-sm text-white/70">Lead Engineer, App Co.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column (Form Side) */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-slate-50 relative">
                <div className="w-full max-w-md mx-auto space-y-8">

                    <div className="md:hidden mb-12">
                        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-[#1e52f1] tracking-tighter">
                            <div className="w-8 h-8 bg-[#1e52f1] rounded-lg flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
                                </svg>
                            </div>
                            Platform
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{heading}</h2>
                        <p className="text-slate-500">{subheading}</p>
                    </div>

                    {children}

                    <div className="pt-6 border-t border-slate-200 flex flex-col items-center">
                        <p className="text-sm text-slate-500 text-center">
                            By continuing, you agree to our{' '}
                            <Link href="#" className="font-medium text-[#1e52f1] hover:underline">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="#" className="font-medium text-[#1e52f1] hover:underline">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};
