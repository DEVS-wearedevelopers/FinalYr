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

const CBS_COLOR = (cbs: number) =>
    cbs >= 0.8 ? { ring: 'border-red-300 bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700 border-red-200',    label: 'Critical' } :
    cbs >= 0.5 ? { ring: 'border-amber-300 bg-amber-50', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Elevated' } :
                 { ring: 'border-green-200 bg-green-50', text: 'text-green-700',  badge: 'bg-green-100 text-green-700 border-green-200', label: 'Low' };

const STATUS_LABEL: Record<string, string> = {
    pending_investigation: 'Awaiting PHO',
    investigating: 'Under PHO Review',
    probable: 'PHO: Probable',
    confirmed: 'PHO: Confirmed',
    invalidated: 'Cleared',
};

type RawAlert = { id: string; cbs_score: number; severity_index: number; status: string; created_at: string; bypass_reason: string | null; sentinel_reports?: { patient_count: number; symptom_matrix: string[]; origin_address?: string } | { patient_count: number; symptom_matrix: string[]; origin_address?: string }[] | null };
type Alert   = Omit<RawAlert, 'sentinel_reports'> & { sentinel_reports?: { patient_count: number; symptom_matrix: string[]; origin_address?: string } | null };

// PostgREST returns sentinel_reports as an array when joined — normalise it
function normalise(raw: RawAlert): Alert {
    const sr = raw.sentinel_reports;
    const report = Array.isArray(sr) ? sr[0] ?? null : sr ?? null;
    return { ...raw, sentinel_reports: report };
}

export default function InstitutionAlerts() {
    const tokenUser = useUserFromToken();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Alert | null>(null);

    const load = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/reports/alerts');
            setAlerts((data.alerts ?? []).map(normalise));
        } catch { setAlerts([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const active   = alerts.filter(a => !['invalidated'].includes(a.status));
    const resolved = alerts.filter(a => a.status === 'invalidated');

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PHO Alerts</h1>
                    <p className="text-slate-500 text-sm mt-0.5">AI-generated alerts from your sentinel reports — reviewed by PHO</p>
                </div>
                <div className="flex items-center gap-3">
                    {active.length > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{active.length} active
                        </span>
                    )}
                    <button onClick={load} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Refresh</button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" /></div>
            ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <svg className="w-14 h-14 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                    <p className="font-semibold text-sm">No alerts generated yet</p>
                    <p className="text-xs mt-1">Alerts appear here when your sentinel reports trigger the AI scoring system</p>
                </div>
            ) : (
                <div className="flex gap-5">
                    {/* Alert list */}
                    <div className="w-80 shrink-0 space-y-3">
                        {active.length > 0 && (
                            <>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active · {active.length}</p>
                                {active.map(a => {
                                    const c = CBS_COLOR(a.cbs_score);
                                    return (
                                        <div key={a.id} onClick={() => setSelected(a)}
                                            className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${selected?.id === a.id ? 'ring-2 ring-[#1e52f1]/30 border-[#1e52f1]' : `${c.ring} hover:shadow-md`}`}>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${c.badge}`}>{c.label}</span>
                                                <span className={`text-2xl font-black ${c.text}`}>{a.cbs_score.toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-700 mb-1">{a.sentinel_reports?.symptom_matrix?.slice(0, 2).join(', ') || 'Unknown symptoms'}</p>
                                            <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                            <div className="mt-2">
                                                <span className="text-xs bg-white/80 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                                    {STATUS_LABEL[a.status] ?? a.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                        {resolved.length > 0 && (
                            <>
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-4">Cleared · {resolved.length}</p>
                                {resolved.map(a => (
                                    <div key={a.id} onClick={() => setSelected(a)}
                                        className={`rounded-2xl border p-3.5 cursor-pointer opacity-60 hover:opacity-80 transition-all ${selected?.id === a.id ? 'border-[#1e52f1] opacity-100' : 'border-slate-200 bg-slate-50'}`}>
                                        <p className="text-xs font-semibold text-slate-600">{a.sentinel_reports?.symptom_matrix?.slice(0, 2).join(', ') || '—'}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">CBS {a.cbs_score.toFixed(2)} · Cleared</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Detail panel */}
                    <div className="flex-1 min-w-0">
                        {selected ? (
                            <div className="space-y-4">
                                {/* CBS card */}
                                <div className={`rounded-2xl border-2 p-6 ${CBS_COLOR(selected.cbs_score).ring}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Confidence-Based Score</p>
                                            <p className={`text-5xl font-black ${CBS_COLOR(selected.cbs_score).text}`}>{selected.cbs_score.toFixed(2)}</p>
                                            <p className="text-sm text-slate-500 mt-1">{CBS_COLOR(selected.cbs_score).label} risk — Severity index {selected.severity_index}/10</p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full border text-xs font-bold ${CBS_COLOR(selected.cbs_score).badge}`}>
                                            {STATUS_LABEL[selected.status] ?? selected.status}
                                        </span>
                                    </div>
                                    {selected.bypass_reason && (
                                        <div className="mt-4 bg-red-100 border border-red-200 rounded-xl p-3">
                                            <p className="text-xs font-bold text-red-700">⚡ Bypass Reason: {selected.bypass_reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Report data */}
                                {selected.sentinel_reports && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Sentinel Report</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 rounded-xl p-3">
                                                <p className="text-xs text-slate-400">Patients Affected</p>
                                                <p className="text-2xl font-black text-slate-800">{selected.sentinel_reports.patient_count}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3">
                                                <p className="text-xs text-slate-400">Origin</p>
                                                <p className="text-sm font-bold text-slate-700 mt-0.5">{selected.sentinel_reports.origin_address || 'Facility premises'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-2">Reported Symptoms</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selected.sentinel_reports.symptom_matrix?.map(s => (
                                                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* What this means */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">What this means for you</p>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        {selected.status === 'pending_investigation' && <p>⏳ Your report has been scored by AI and is awaiting PHO assignment. No action needed from you.</p>}
                                        {selected.status === 'investigating' && <p>🔍 A PHO is actively reviewing this alert. They may contact you for additional information.</p>}
                                        {selected.status === 'probable' && <p>⚠️ The PHO has classified this as a probable outbreak signal. Continue monitoring and reporting new cases.</p>}
                                        {selected.status === 'confirmed' && <p>🚨 This has been confirmed as a public health concern. Follow PHO advisories and continue full reporting compliance.</p>}
                                        {selected.status === 'invalidated' && <p>✅ The PHO has reviewed and cleared this alert. No further action required. Your facility is clear.</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                <p className="text-sm font-semibold">Select an alert to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
