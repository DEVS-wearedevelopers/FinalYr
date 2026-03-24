'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import apiClient from '@/services/apiClient';

const NAV = [
    { label: 'Overview', href: '/dashboard/institution', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports',  href: '/dashboard/institution/reports',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Alerts',   href: '/dashboard/institution/alerts',   icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Inbox',    href: '/dashboard/institution/inbox',    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { label: 'Settings', href: '/dashboard/institution/settings', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

// Static system messages — things like blacklisting, data quality flags, etc.
// These appear at the top before any DB advisories
const SYSTEM_MESSAGES = [
    {
        id: 'sys-1',
        type: 'info' as const,
        title: 'Registration Approved',
        body: 'Your institution registration was approved. Your account has been activated and you may submit sentinel reports.',
        from: 'MERMS System',
        date: null, // Will show as 'System'
        read: true,
    },
];

type Advisory = {
    id: string; message: string; severity: 'ADVISORY' | 'WARNING' | 'CRITICAL';
    created_at: string; dismissed: boolean;
};

type SystemMsg = typeof SYSTEM_MESSAGES[0];

const SEVERITY_STYLE = {
    ADVISORY: { bar: 'bg-blue-500',  bg: 'bg-blue-50  border-blue-200',  icon: 'text-blue-500',  label: 'Advisory' },
    WARNING:  { bar: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', label: 'Warning' },
    CRITICAL: { bar: 'bg-red-600',   bg: 'bg-red-50   border-red-200',   icon: 'text-red-600',   label: 'Critical' },
};

export default function InstitutionInbox() {
    const tokenUser = useUserFromToken();
    const [advisories, setAdvisories] = useState<Advisory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Advisory | SystemMsg | null>(SYSTEM_MESSAGES[0]);

    const load = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/reports/inbox');
            setAdvisories(data.messages ?? []);
        } catch { setAdvisories([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const unreadCount = advisories.filter(a => !a.dismissed).length;
    const isAdvisory = (item: any): item is Advisory => 'severity' in item;

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institution Inbox</h1>
                    <p className="text-slate-500 text-sm mt-0.5">System notices, PHO advisories and EOC communications</p>
                </div>
                {unreadCount > 0 && (
                    <span className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-full">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            <div className="flex gap-5 h-[calc(100vh-220px)] min-h-[500px]">
                {/* Message list */}
                <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
                    {/* System messages */}
                    {SYSTEM_MESSAGES.map(msg => (
                        <button key={msg.id} onClick={() => setSelected(msg)}
                            className={`w-full text-left rounded-2xl border p-4 transition-all ${selected && !isAdvisory(selected) && (selected as SystemMsg).id === msg.id ? 'border-[#1e52f1] ring-2 ring-[#1e52f1]/20 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#1e52f1]/10 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-[#1e52f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{msg.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{msg.from}</p>
                                </div>
                                {msg.read && <div className="w-2 h-2 rounded-full bg-slate-200 mt-1 shrink-0" />}
                            </div>
                        </button>
                    ))}

                    {/* PHO Advisories from DB */}
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" /></div>
                    ) : advisories.length === 0 ? (
                        <p className="text-xs text-slate-300 text-center py-4">No PHO advisories yet</p>
                    ) : advisories.map(a => {
                        const s = SEVERITY_STYLE[a.severity];
                        const isSelected = isAdvisory(selected) && selected.id === a.id;
                        return (
                            <button key={a.id} onClick={() => setSelected(a)}
                                className={`w-full text-left rounded-2xl border p-4 transition-all relative overflow-hidden ${isSelected ? 'border-[#1e52f1] ring-2 ring-[#1e52f1]/20' : `${s.bg} hover:shadow-sm`}`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} />
                                <div className="pl-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${s.bg}`}>{s.label}</span>
                                        {!a.dismissed && <span className="w-2 h-2 rounded-full bg-red-500" />}
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{a.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Message detail */}
                <div className="flex-1 min-w-0">
                    {selected ? (
                        isAdvisory(selected) ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-7 h-full">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-5 ${SEVERITY_STYLE[selected.severity].bg}`}>
                                    <span className={`w-2 h-2 rounded-full ${SEVERITY_STYLE[selected.severity].bar}`} />
                                    {SEVERITY_STYLE[selected.severity].label} Advisory
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mb-2">PHO Advisory</h2>
                                <p className="text-xs text-slate-400 mb-6">{new Date(selected.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <p className="text-sm text-slate-700 leading-relaxed">{selected.message}</p>
                                </div>
                                {selected.severity === 'CRITICAL' && (
                                    <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
                                        <p className="text-sm font-bold text-red-700 mb-1">⛔ Critical Advisory — Immediate Action Required</p>
                                        <p className="text-xs text-red-600">You must acknowledge this advisory and comply within 24 hours. Non-compliance may result in facility review.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 p-7 h-full">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e52f1]/10 border border-[#1e52f1]/20 text-[#1e52f1] text-xs font-bold mb-5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                    System Notice
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mb-1">{(selected as SystemMsg).title}</h2>
                                <p className="text-xs text-slate-400 mb-6">From: {(selected as SystemMsg).from}</p>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <p className="text-sm text-slate-700 leading-relaxed">{(selected as SystemMsg).body}</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            <p className="text-sm font-semibold">Select a message</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
