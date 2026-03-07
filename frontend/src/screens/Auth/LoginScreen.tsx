"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { apiClient } from '@/services/apiClient';

// ─── Dev Test Accounts ────────────────────────────────────────────────────────
const TEST_ACCOUNTS = [
    { role: 'Institution', email: 'institution@merms.test', password: 'MermsInst@2026', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { role: 'PHO', email: 'pho@merms.test', password: 'MermsPHO@2026', color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { role: 'EOC Admin', email: 'eoc@merms.test', password: 'MermsEOC@2026', color: 'text-red-600 bg-red-50 border-red-200' },
    { role: 'Civilian', email: 'civilian@merms.test', password: 'MermsCiv@2026', color: 'text-green-600 bg-green-50 border-green-200' },
];

// ─── Dev Login Shortcut ───────────────────────────────────────────────────────
function DevLoginPanel({ onSelect }: { onSelect: (email: string, password: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .3 2.7-1.1 2.7H3.9c-1.4 0-2.1-1.7-1.1-2.7L4.6 15.3" />
                        </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Dev Quick Login</span>
                    <span className="text-xs text-slate-400">— skip registration</span>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="border-t border-dashed border-slate-200 px-4 py-3 space-y-2 bg-slate-50/50">
                    {TEST_ACCOUNTS.map(acc => (
                        <button
                            key={acc.role}
                            type="button"
                            onClick={() => { onSelect(acc.email, acc.password); setOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${acc.color}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold w-20 shrink-0">{acc.role}</span>
                                <span className="text-xs font-mono opacity-70 truncate">{acc.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <span className="text-xs font-mono opacity-60">{acc.password}</span>
                                <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </button>
                    ))}
                    <p className="text-xs text-slate-400 text-center pt-1">
                        Click any row to auto-fill credentials
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const { data } = await apiClient.post('/auth/login', { email, password });
            if (data.session?.access_token) {
                localStorage.setItem('token', data.session.access_token);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            heading="Welcome back"
            subheading="Enter your credentials to access your account."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm">
                        {errorMsg}
                    </div>
                )}

                <Input
                    label="Email address"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="space-y-1">
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end pt-1">
                        <Link href="/auth/forgot-password" className="text-sm font-medium text-[#1e52f1] hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" fullWidth disabled={isLoading}>
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                        </span>
                    ) : 'Sign in'}
                </Button>
            </form>

            {/* ── Dev Quick Login ── */}
            <div className="mt-5">
                <DevLoginPanel onSelect={(e, p) => { setEmail(e); setPassword(p); setErrorMsg(''); }} />
            </div>

            <div className="text-center mt-5">
                <p className="text-sm text-slate-600">
                    Don&#39;t have an account?{' '}
                    <Link href="/register" className="font-semibold text-[#1e52f1] hover:underline">
                        Create account
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
