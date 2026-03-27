'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import { mockGetBroadcasts, type Broadcast } from '@/services/mockData';

const NAV = [
    { label: 'Overview', href: '/dashboard/institution', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports',  href: '/dashboard/institution/reports', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Inbox',    href: '/dashboard/institution/inbox',   icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
];

function rel(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
}

export default function InstitutionInbox() {
    const tokenUser = useUserFromToken();
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

    useEffect(() => { setBroadcasts(mockGetBroadcasts()); }, []);

    const active   = broadcasts.filter(b => b.active);
    const archived = broadcasts.filter(b => !b.active);

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PHO Broadcast Inbox</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    Health advisories and alerts from the Public Health Office
                    {active.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            {active.length} active
                        </span>
                    )}
                </p>
            </div>

            {broadcasts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-slate-500 text-sm font-medium">No broadcasts yet</p>
                    <p className="text-slate-400 text-xs mt-1">PHO health advisories will appear here when issued</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Active broadcasts */}
                    {active.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                Active Advisories ({active.length})
                            </p>
                            {active.map(bc => (
                                <div key={bc.id} className={`rounded-2xl border overflow-hidden ${
                                    bc.type === 'lockdown'    ? 'border-purple-300' :
                                    bc.type === 'hemorrhagic' ? 'border-red-300' :
                                    bc.type === 'enteric'     ? 'border-amber-300' : 'border-blue-300'
                                }`}>
                                    {/* Coloured strip */}
                                    <div className={`px-5 py-3 flex items-center gap-3 ${
                                        bc.type === 'lockdown'    ? 'bg-purple-700' :
                                        bc.type === 'hemorrhagic' ? 'bg-red-600' :
                                        bc.type === 'enteric'     ? 'bg-amber-500' : 'bg-blue-600'
                                    }`}>
                                        <span className="text-xl">
                                            {bc.type === 'lockdown' ? '🔒' : bc.type === 'hemorrhagic' ? '🩸' : bc.type === 'enteric' ? '🤢' : bc.type === 'respiratory' ? '🫁' : '📢'}
                                        </span>
                                        <p className="text-white font-black text-sm">{bc.title}</p>
                                        {bc.type === 'lockdown' && (
                                            <span className="ml-auto text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full border border-white/30 animate-pulse">LOCKDOWN</span>
                                        )}
                                    </div>
                                    <div className="bg-white px-5 py-4 space-y-2">
                                        <p className="text-sm leading-relaxed text-slate-700">{bc.message}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>From <strong className="text-slate-600">{bc.issued_by}</strong></span>
                                            <span>·</span>
                                            <span>Zone: {bc.zone}</span>
                                            <span>·</span>
                                            <span>{rel(bc.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Archived */}
                    {archived.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Archived ({archived.length})</p>
                            {archived.map(bc => (
                                <div key={bc.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 opacity-60">
                                    <p className="text-sm font-semibold text-slate-600">{bc.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{rel(bc.created_at)} · Removed by EOC</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
