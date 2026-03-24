'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import apiClient from '@/services/apiClient';

const NAV = [
    { label: 'Overview', href: '/dashboard/institution', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports',  href: '/dashboard/institution/reports',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Alerts',   href: '/dashboard/institution/alerts',   icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Inbox',    href: '/dashboard/institution/inbox',    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { label: 'Settings', href: '/dashboard/institution/settings', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

function rel(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (d < 1) return 'just now';
    if (d < 60) return `${d}m ago`;
    if (d < 1440) return `${Math.floor(d / 60)}h ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

const STATUS_STYLES: Record<string, string> = {
    'Pending AI':            'bg-slate-100 text-slate-500 border-slate-200',
    'pending_investigation': 'bg-amber-100 text-amber-700 border-amber-200',
    'investigating':         'bg-blue-100  text-blue-700  border-blue-200',
    'probable':              'bg-orange-100 text-orange-700 border-orange-200',
    'confirmed':             'bg-red-100   text-red-700   border-red-200',
    'invalidated':           'bg-green-100 text-green-700 border-green-200',
};

const SEVERITY_COLORS = ['', 'bg-green-500', 'bg-green-400', 'bg-lime-400', 'bg-yellow-400', 'bg-amber-400', 'bg-orange-400', 'bg-orange-500', 'bg-red-400', 'bg-red-500', 'bg-red-700'];

type Report = {
    id: string; created_at: string; patient_count: number;
    symptom_matrix: string[]; severity: number; status: string;
    origin_address?: string; notes?: string;
};

type Filter = 'all' | 'pending' | 'reviewing' | 'closed';

function statusGroup(s: string): Filter {
    if (s === 'Pending AI') return 'pending';
    if (['investigating', 'pending_investigation'].includes(s)) return 'reviewing';
    if (['confirmed', 'probable', 'invalidated'].includes(s)) return 'closed';
    return 'all';
}

export default function InstitutionReports() {
    const tokenUser = useUserFromToken();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/reports/feed');
            setReports(data.reports ?? []);
        } catch { setReports([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const visible = reports.filter(r => {
        const matchFilter = filter === 'all' || statusGroup(r.status) === filter;
        const matchSearch = search === '' || r.symptom_matrix.some(s => s.toLowerCase().includes(search.toLowerCase()));
        return matchFilter && matchSearch;
    });

    const counts = {
        all: reports.length,
        pending:   reports.filter(r => statusGroup(r.status) === 'pending').length,
        reviewing: reports.filter(r => statusGroup(r.status) === 'reviewing').length,
        closed:    reports.filter(r => statusGroup(r.status) === 'closed').length,
    };

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sentinel Report History</h1>
                    <p className="text-slate-500 text-sm mt-0.5">All submissions from your facility</p>
                </div>
                <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                </button>
            </div>

            {/* Filter tabs + search */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
                    {(['all', 'pending', 'reviewing', 'closed'] as Filter[]).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize flex items-center gap-1.5 ${filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                            {f}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/60 text-slate-400'}`}>
                                {counts[f]}
                            </span>
                        </button>
                    ))}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symptoms..."
                    className="ml-auto px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] w-52" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Column headers */}
                <div className="grid grid-cols-[80px_1fr_100px_90px_100px_36px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {['Time', 'Symptoms', 'Patients', 'Severity', 'Status', ''].map(h => (
                        <p key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</p>
                    ))}
                </div>

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && visible.length === 0 && (
                    <div className="py-16 text-center">
                        <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <p className="text-slate-400 text-sm font-medium">No reports match this filter</p>
                    </div>
                )}

                <div className="divide-y divide-slate-50">
                    {visible.map(r => (
                        <React.Fragment key={r.id}>
                            <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                                className="grid grid-cols-[80px_1fr_100px_90px_100px_36px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50/60 cursor-pointer transition-colors">
                                <p className="text-xs text-slate-500 font-medium">{rel(r.created_at)}</p>
                                <p className="text-xs font-semibold text-slate-700 truncate">{r.symptom_matrix?.join(' · ') || '—'}</p>
                                <p className="text-xs font-bold text-slate-800">{r.patient_count} pts</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[r.severity] || 'bg-slate-300'}`} />
                                    <span className="text-xs font-bold text-slate-700">{r.severity}/10</span>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    {r.status.replace('_', ' ')}
                                </span>
                                <svg className={`w-4 h-4 text-slate-300 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            {expanded === r.id && (
                                <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Symptom List</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {r.symptom_matrix?.map(s => (
                                                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {r.origin_address && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origin Location</p>
                                                <p className="text-sm text-slate-700">{r.origin_address}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                                            <p className="text-sm text-slate-700">{new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                        {r.notes && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                                                <p className="text-sm text-slate-600 italic">"{r.notes}"</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-300 italic">Report ID: {r.id}</p>
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
