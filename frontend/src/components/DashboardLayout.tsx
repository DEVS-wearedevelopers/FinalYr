'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// ── Decode token — supports both real Supabase JWTs and mock base64 tokens ────
export function useUserFromToken() {
    const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            // Mock token: single base64 segment (no dots)
            const segments = token.split('.');
            const raw = segments.length >= 3 ? segments[1] : token;
            const payload = JSON.parse(atob(raw));

            // Mock token has { id, role, name, email }
            if (payload.name && payload.role) {
                setUser({ name: payload.name, email: payload.email ?? '', role: payload.role });
                return;
            }

            // Real Supabase JWT
            const meta = payload.user_metadata ?? {};
            const firstName = meta.firstName || meta.first_name || '';
            const lastName  = meta.lastName  || meta.last_name  || '';
            const name = [firstName, lastName].filter(Boolean).join(' ') || payload.email?.split('@')[0] || 'User';
            setUser({ name, email: payload.email ?? '', role: meta.role ?? 'civilian' });
        } catch {
            setUser(null);
        }
    }, []);
    return user;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    navItems: NavItem[];
    role: string;
    userName?: string;
}

// ── Dark mode hook ────────────────────────────────────────────────────────────
function useDarkMode() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        // Only activate dark mode if the user has explicitly saved it.
        // Do NOT follow prefers-color-scheme — default is always light.
        const saved = localStorage.getItem('domrs-theme');
        const initial = saved === 'dark';
        setDark(initial);
        document.documentElement.classList.toggle('dark', initial);
    }, []);

    const toggle = () => {
        setDark(d => {
            const next = !d;
            document.documentElement.classList.toggle('dark', next);
            localStorage.setItem('domrs-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    return { dark, toggle };
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    navItems,
    role,
    userName = 'User',
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { dark, toggle } = useDarkMode();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const roleColors: Record<string, string> = {
        institution: 'bg-blue-100 text-blue-700',
        pho: 'bg-green-100 text-green-700',
        eoc: 'bg-red-100 text-red-700',
        civilian: 'bg-slate-100 text-slate-700',
    };
    const roleLabel: Record<string, string> = {
        institution: 'Institution',
        pho: 'PHO',
        eoc: 'EOC Admin',
        civilian: 'Civilian',
    };

    const Sidebar = () => (
        <aside className="flex flex-col h-screen bg-white border-r border-slate-100 w-64 overflow-hidden">
            {/* Logo + dark toggle */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                <div className="w-9 h-9 bg-[#1e52f1] rounded-xl flex items-center justify-center shadow-md shadow-[#1e52f1]/20">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
                    </svg>
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900 flex-1">DOMRS</span>
                {/* Dark mode toggle */}
                <button
                    onClick={toggle}
                    title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                >
                    {dark ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* User Badge */}
            <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-9 h-9 rounded-full bg-[#1e52f1] flex items-center justify-center text-white font-semibold text-sm">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${roleColors[role] ?? 'bg-slate-100 text-slate-600'}`}>
                            {roleLabel[role] ?? role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-[#1e52f1] text-white shadow-sm shadow-[#1e52f1]/30'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            {/* Desktop Sidebar — fixed, never scrolls */}
            <div className="hidden md:flex flex-col flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-50 flex flex-col h-full w-64 shadow-2xl">
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Main Content — only this scrolls */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold text-slate-900 tracking-tight">DOMRS</span>
                    <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                        {dark ? '☀️' : '🌙'}
                    </button>
                </header>

                {/* Page Content — scrolls */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};
