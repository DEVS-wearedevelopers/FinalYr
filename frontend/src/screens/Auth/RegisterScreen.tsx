"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { apiClient } from '@/services/apiClient';

const ROLE_OPTIONS = [
    {
        id: 'civilian',
        label: 'Civilian',
        badge: 'Level 0',
        description: 'Report incidents and track local health alerts.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
        ),
        href: null,
    },
    {
        id: 'institution',
        label: 'Institution',
        badge: 'Level 1',
        description: 'Hospitals, clinics & healthcare facilities. Requires verification.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
        ),
        href: '/register/institution',
    },
    {
        id: 'pho',
        label: 'Public Health Officer',
        badge: 'Level 2',
        description: 'Manage alerts and coordinate healthcare responses.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        href: '/register/pho',
    },
    {
        id: 'eoc',
        label: 'EOC Admin',
        badge: 'Level 3',
        description: 'Emergency Operations Centre — full platform access.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        href: null,
    },
];

export default function RegisterScreen() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string>('civilian');
    const [showBasicForm, setShowBasicForm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleRoleSelect = (roleId: string, href: string | null) => {
        setSelectedRole(roleId);
        if (href) {
            router.push(href);
        } else {
            setShowBasicForm(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const { data } = await apiClient.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                role: selectedRole,
                firstName: formData.firstName,
                lastName: formData.lastName
            });

            if (data.user) {
                if (data.session?.access_token) {
                    localStorage.setItem('token', data.session.access_token);
                    router.push('/dashboard');
                } else {
                    router.push('/login');
                }
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.id]: e.target.value
        }));
    };

    const selectedRoleData = ROLE_OPTIONS.find(r => r.id === selectedRole);

    return (
        <AuthLayout
            heading="Create an account"
            subheading="Choose your role to get started on MERMS."
        >
            {!showBasicForm ? (
                /* ── Role Selector ── */
                <div className="space-y-6">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Select your role</p>
                    <div className="grid grid-cols-1 gap-3">
                        {ROLE_OPTIONS.map((role) => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => handleRoleSelect(role.id, role.href)}
                                className={`group w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-[#1e52f1]/50 hover:bg-blue-50/40 ${selectedRole === role.id
                                    ? 'border-[#1e52f1] bg-blue-50'
                                    : 'border-slate-200 bg-white'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${selectedRole === role.id
                                    ? 'bg-[#1e52f1] text-white'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-[#1e52f1]/10 group-hover:text-[#1e52f1]'
                                    }`}>
                                    {role.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-bold transition-colors ${selectedRole === role.id ? 'text-[#1e52f1]' : 'text-slate-800'}`}>
                                            {role.label}
                                        </p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${selectedRole === role.id
                                            ? 'bg-[#1e52f1]/15 text-[#1e52f1]'
                                            : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {role.badge}
                                        </span>
                                        {role.href && (
                                            <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                Full Onboarding →
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{role.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-[#1e52f1] hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            ) : (
                /* ── Basic Sign-Up Form ── */
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#1e52f1] text-white flex items-center justify-center shrink-0">
                            {selectedRoleData?.icon}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                                Registering as: <span className="text-[#1e52f1]">{selectedRoleData?.label}</span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowBasicForm(false)}
                            className="text-xs text-slate-500 hover:text-[#1e52f1] font-medium underline"
                        >
                            Change
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Input
                            id="firstName" label="First name" type="text" placeholder="Jane"
                            value={formData.firstName} onChange={handleChange} required
                        />
                        <Input
                            id="lastName" label="Last name" type="text" placeholder="Doe"
                            value={formData.lastName} onChange={handleChange} required
                        />
                    </div>

                    <Input
                        id="email" label="Email address" type="email" placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                    />

                    <Input
                        id="password" label="Password" type="password" placeholder="••••••••"
                        value={formData.password} onChange={handleChange} required
                    />

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating account...
                            </span>
                        ) : (
                            'Create account'
                        )}
                    </Button>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-[#1e52f1] hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            )}
        </AuthLayout>
    );
}
