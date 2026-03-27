'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import { mockGetAlerts, mockGetBroadcasts, type AiAlert, type Broadcast } from '@/services/mockData';

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

function cbsColor(cbs: number) {
    if (cbs >= 0.8) return 'text-red-700 bg-red-50 border-red-200';
    if (cbs >= 0.5) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-green-700 bg-green-50 border-green-200';
}

export default function InstitutionAlerts() {
    const tokenUser = useUserFromToken();
    const [alerts, setAlerts]         = useState<AiAlert[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [selected, setSelected]     = useState<AiAlert | null>(null);

    useEffect(() => {
        const a = mockGetAlerts();
        setAlerts(a);
        if (a.length > 0) setSelected(a[0]);
        setBroadcasts(mockGetBroadcasts().filter(b => b.active));
    }, []);

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Health Alerts</h1>
                <p className="text-slate-500 text-sm mt-0.5">Active alerts and PHO advisories for your zone</p>
            </div>

            {/* Active broadcasts from PHO */}
            {broadcasts.length > 0 && (
                <div className="mb-6 space-y-3">
                    {broadcasts.map(bc => (
                        <div key={bc.id} className={`rounded-2xl border p-5 flex items-start gap-4 ${
                            bc.type === 'lockdown' ? 'bg-purple-700 border-purple-700' :
                            bc.type === 'hemorrhagic' ? 'bg-red-600 border-red-700' :
                            bc.type === 'enteric' ? 'bg-amber-500 border-amber-600' : 'bg-blue-600 border-blue-700'
                        }`}>
                            <span className="text-2xl shrink-0">
                                {bc.type === 'lockdown' ? '🔒' : bc.type === 'hemorrhagic' ? '🩸' : bc.type === 'enteric' ? '🤢' : '📢'}
                            </span>
                            <div>
                                <p className="font-black text-base text-white">{bc.title}</p>
                                <p className="text-sm text-white/80 mt-1 leading-relaxed">{bc.message}</p>
                                <p className="text-xs text-white/60 mt-1">From {bc.issued_by} · {rel(bc.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alerts list */}
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CBS Inbox — All Zones</p>
                    {alerts.length === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No active alerts</div>
                    )}
                    {alerts.map(a => (
                        <div key={a.id} onClick={() => setSelected(a)}
                            className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                                selected?.id === a.id ? 'border-[#1e52f1] ring-2 ring-[#1e52f1]/20' : 'border-slate-200'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-slate-700 truncate">{a.sentinel_reports?.origin_address?.split(',')[0]}</p>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${cbsColor(a.cbs_score)}`}>
                                    {a.cbs_score.toFixed(2)}
                                </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${a.cbs_score >= 0.8 ? 'bg-red-500' : a.cbs_score >= 0.5 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${a.cbs_score * 100}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">{rel(a.created_at)}</p>
                        </div>
                    ))}
                </div>

                {selected && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{selected.sentinel_reports?.origin_address}</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Zone: {selected.zone_id} · {rel(selected.created_at)}</p>
                            </div>
                            <div className={`text-center px-4 py-2 rounded-xl border ${cbsColor(selected.cbs_score)}`}>
                                <p className="text-2xl font-black">{selected.cbs_score.toFixed(2)}</p>
                                <p className="text-xs opacity-70">CBS Score</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <p className="text-2xl font-black text-slate-900">{selected.sentinel_reports?.patient_count ?? '?'}</p>
                                <p className="text-xs text-slate-400">Patients</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <p className={`text-sm font-black ${
                                    selected.status === 'confirmed' ? 'text-red-600' :
                                    selected.status === 'probable' ? 'text-orange-600' :
                                    selected.status === 'investigating' ? 'text-blue-600' : 'text-slate-500'
                                }`}>{selected.status.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-slate-400">PHO Status</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Reported Symptoms</p>
                            <div className="flex flex-wrap gap-1.5">
                                {(selected.sentinel_reports?.symptom_matrix ?? []).map(s => (
                                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
                                ))}
                            </div>
                        </div>
                        {selected.justification && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                                <p className="text-xs font-bold text-blue-700 mb-1">PHO Assessment</p>
                                <p className="text-xs text-blue-800">{selected.justification}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
