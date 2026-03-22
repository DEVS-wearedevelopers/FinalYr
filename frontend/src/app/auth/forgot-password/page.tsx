'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { apiClient } from '@/services/apiClient';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        try {
            await apiClient.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            heading="Reset your password"
            subheading="Enter your email and we'll send you a reset link."
        >
            {sent ? (
                /* ── Success state ── */
                <div className="space-y-5 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Check your inbox</p>
                        <p className="text-sm text-slate-500 mt-1">
                            If <span className="font-semibold text-slate-700">{email}</span> is registered, you'll receive a password reset link shortly.
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e52f1] hover:underline"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Sign In
                    </Link>
                </div>
            ) : (
                /* ── Request form ── */
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

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Sending link...
                            </span>
                        ) : 'Send reset link'}
                    </Button>

                    <div className="text-center">
                        <Link href="/login" className="text-sm font-semibold text-[#1e52f1] hover:underline">
                            ← Back to Sign In
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
