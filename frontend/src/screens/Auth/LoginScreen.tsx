"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { mockLogin } from '@/services/mockData';

// ─── Demo Accounts ────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { role: 'Civilian',     email: 'civilian@domrs.demo',  password: 'Demo1234', color: 'text-green-700 bg-green-50 border-green-200',    dot: 'bg-green-500' },
  { role: 'Institution',  email: 'hospital@domrs.demo',  password: 'Demo1234', color: 'text-blue-700 bg-blue-50 border-blue-200',        dot: 'bg-blue-500'  },
  { role: 'PHO',          email: 'pho@domrs.demo',        password: 'Demo1234', color: 'text-purple-700 bg-purple-50 border-purple-200',  dot: 'bg-purple-500'},
  { role: 'EOC Admin',    email: 'eoc@domrs.demo',        password: 'Demo1234', color: 'text-red-700 bg-red-50 border-red-200',           dot: 'bg-red-500'   },
];

function DemoPanel({ onSelect }: { onSelect: (email: string, pw: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 overflow-hidden bg-amber-50/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold shrink-0">
            🧪
          </div>
          <span className="text-xs font-semibold text-amber-800">Demo Quick Login</span>
          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">4 accounts</span>
        </div>
        <svg className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-amber-200 px-4 py-3 space-y-2 bg-white">
          {DEMO_ACCOUNTS.map(acc => (
            <button
              key={acc.role}
              type="button"
              onClick={() => { onSelect(acc.email, acc.password); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${acc.color}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${acc.dot} shrink-0`} />
                <span className="text-xs font-bold w-24 shrink-0">{acc.role}</span>
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
          <p className="text-xs text-slate-400 text-center pt-1">Click any row to auto-fill &amp; sign in</p>
        </div>
      )}
    </div>
  );
}

// ─── Role → dashboard map ─────────────────────────────────────────────────────
const ROLE_REDIRECT: Record<string, string> = {
  institution: '/dashboard/institution',
  pho:         '/dashboard/pho',
  eoc:         '/dashboard/eoc',
  civilian:    '/dashboard/civilian',
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]        = useState('');

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setIsLoading(true);
    setError('');
    // Small simulated delay for realism
    await new Promise(res => setTimeout(res, 500));
    try {
      const { token, role } = mockLogin(loginEmail, loginPassword);
      localStorage.setItem('token', token);
      localStorage.setItem('demo_role', role);
      const dest = ROLE_REDIRECT[role] ?? '/dashboard/civilian';
      router.push(dest);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to access your DOMRS dashboard."
    >
      {/* Offline badge */}
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-green-700">Running offline — demo mode</span>
        <span className="ml-auto text-xs text-green-500">No internet required</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          placeholder="e.g. civilian@domrs.demo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in…
            </span>
          ) : 'Sign in'}
        </Button>
      </form>

      {/* Demo quick login */}
      <div className="mt-5">
        <DemoPanel onSelect={(e, p) => { setEmail(e); setPassword(p); setError(''); doLogin(e, p); }} />
      </div>
    </AuthLayout>
  );
}
