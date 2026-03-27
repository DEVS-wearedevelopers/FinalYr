'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import { mockGetReports, type Report } from '@/services/mockData';

const NAV = [
    { label: 'Overview', href: '/dashboard/institution', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports',  href: '/dashboard/institution/reports',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Inbox',    href: '/dashboard/institution/inbox',    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
];

function rel(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (d < 1) return 'just now';
    if (d < 60) return `${d}m ago`;
    if (d < 1440) return `${Math.floor(d / 60)}h ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function cbsBadge(cbs?: number) {
    if (!cbs) return <span className="text-xs text-slate-300">—</span>;
    const cls = cbs >= 0.8 ? 'bg-red-50 text-red-700 border-red-200'
              : cbs >= 0.5 ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-green-50 text-green-700 border-green-200';
    return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>CBS {cbs.toFixed(2)}</span>;
}

function statusLabel(s: string) {
    const map: Record<string, string> = {
        pending_ai:   'Pending AI',
        ai_scored:    'AI Scored',
        pho_review:   'PHO Review',
        validated:    'Validated',
        dismissed:    'Dismissed',
    };
    return map[s] ?? s.replace(/_/g, ' ');
}

function statusCls(s: string) {
    if (s === 'validated')  return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'pho_review') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'ai_scored')  return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'dismissed')  return 'bg-slate-100 text-slate-400 border-slate-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
}

type Filter = 'all' | 'sentinel' | 'community';

export default function InstitutionReports() {
    const tokenUser = useUserFromToken();
    const [reports, setReports]   = useState<Report[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filter, setFilter]     = useState<Filter>('all');
    const [search, setSearch]     = useState('');

    const load = () => setReports(mockGetReports()); // All reports — sentinel + community

    useEffect(() => { load(); }, []);

    const visible = reports.filter(r => {
        if (filter === 'sentinel' && r.source !== 'sentinel') return false;
        if (filter === 'community' && r.source !== 'community') return false;
        if (search && !r.symptom_matrix.some(s => s.toLowerCase().includes(search.toLowerCase()))
            && !r.origin_address?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const counts = {
        all:       reports.length,
        sentinel:  reports.filter(r => r.source === 'sentinel').length,
        community: reports.filter(r => r.source === 'community').length,
    };

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report History</h1>
                    <p className="text-slate-500 text-sm mt-0.5">All sentinel and community reports in your zone</p>
                </div>
                <button onClick={load}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
                    <p className="text-3xl font-black text-slate-900">{counts.all}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Total Reports</p>
                </div>
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 text-center shadow-sm">
                    <p className="text-3xl font-black text-blue-700">{counts.sentinel}</p>
                    <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-wide">Sentinel (Facility)</p>
                </div>
                <div className="bg-green-50 rounded-2xl border border-green-200 p-5 text-center shadow-sm">
                    <p className="text-3xl font-black text-green-700">{counts.community}</p>
                    <p className="text-xs font-bold text-green-600 mt-1 uppercase tracking-wide">Community</p>
                </div>
            </div>

            {/* Filter + search bar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
                    {(['all', 'sentinel', 'community'] as Filter[]).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize flex items-center gap-1.5 ${filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                            {f === 'sentinel' ? '🏥 Sentinel' : f === 'community' ? '📍 Community' : '📋 All'}
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === f ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/60 text-slate-400'}`}>
                                {counts[f]}
                            </span>
                        </button>
                    ))}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search symptoms or location…"
                    className="ml-auto px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] w-60" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[70px_60px_1fr_80px_80px_100px_32px] gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {['Time', 'Source', 'Symptoms', 'Patients', 'Severity', 'Status', ''].map(h => (
                        <p key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</p>
                    ))}
                </div>

                {visible.length === 0 && (
                    <div className="py-16 text-center">
                        <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-400">No reports match this filter</p>
                    </div>
                )}

                <div className="divide-y divide-slate-50">
                    {visible.map(r => (
                        <React.Fragment key={r.id}>
                            <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                                className="grid grid-cols-[70px_60px_1fr_80px_80px_100px_32px] gap-3 items-center px-5 py-3.5 hover:bg-slate-50/60 cursor-pointer transition-colors">
                                <p className="text-xs text-slate-500 font-medium">{rel(r.created_at)}</p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border text-center ${
                                    r.source === 'sentinel' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                    {r.source === 'sentinel' ? '🏥' : '📍'}
                                </span>
                                <p className="text-xs font-semibold text-slate-700 truncate">{r.symptom_matrix.join(' · ') || '—'}</p>
                                <p className="text-xs font-bold text-slate-800">{r.patient_count} pts</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${
                                        r.severity >= 8 ? 'bg-red-500' : r.severity >= 5 ? 'bg-amber-500' : 'bg-green-500'
                                    }`} />
                                    <span className="text-xs font-bold text-slate-700">{r.severity}/10</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border text-center ${statusCls(r.status)}`}>
                                    {statusLabel(r.status)}
                                </span>
                                <svg className={`w-4 h-4 text-slate-300 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {expanded === r.id && (
                                <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {r.symptom_matrix.map(s => (
                                                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                            <p className="text-sm text-slate-700">{r.origin_address || '—'}</p>
                                        </div>
                                        {r.lga && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">LGA</p>
                                                <p className="text-sm text-slate-700">{r.lga}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CBS AI Score</p>
                                            {cbsBadge(r.cbs_score)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pipeline Status</p>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusCls(r.status)}`}>{statusLabel(r.status)}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                                            <p className="text-sm text-slate-700">{new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                        {r.notes && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                                                <p className="text-sm text-slate-600 italic">&ldquo;{r.notes}&rdquo;</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-300">ID: {r.id}</p>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
