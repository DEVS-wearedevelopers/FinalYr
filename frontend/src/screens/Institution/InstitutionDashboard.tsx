'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import apiClient from '@/services/apiClient';

const SentinelModal = dynamic(() => import('./components/SentinelModal'), { ssr: false });

// ── Utils ──────────────────────────────────────────────────────────────────────
const NOW = Date.now();
function rel(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (d < 60) return `${d}m ago`;
    if (d < 1440) return `${Math.floor(d / 60)}h ago`;
    return `${Math.floor(d / 1440)}d ago`;
}

// ── Status badge ───────────────────────────────────────────────────────────────
function PipelineBadge({ status, cbs }: { status: string; cbs?: number }) {
    const s = status.toLowerCase().replace(' ', '_');
    if (s === 'pending_ai') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">Pending AI Scan</span>;
    if (s === 'ai_scored') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">AI Scored {cbs !== undefined ? `— CBS: ${cbs.toFixed(2)}` : ''}</span>;
    if (s.includes('pho')) return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">Under PHO Review</span>;
    if (s === 'validated') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">Validated</span>;
    if (s === 'dismissed') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-50 text-slate-400 border border-slate-100">Dismissed</span>;
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">{status}</span>;
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV = [
    { label: 'Overview',  href: '/dashboard/institution',          icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports',   href: '/dashboard/institution/reports',   icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Alerts',    href: '/dashboard/institution/alerts',    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Inbox',     href: '/dashboard/institution/inbox',     icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { label: 'Settings',  href: '/dashboard/institution/settings',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

export default function InstitutionDashboard() {
    const [showModal, setShowModal] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    
    // Server data state
    const [analytics, setAnalytics] = useState<any>(null);
    const [feed, setFeed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [analyticsRes, feedRes] = await Promise.all([
                apiClient.get('/reports/analytics'),
                apiClient.get('/reports/feed')
            ]);
            setAnalytics(analyticsRes.data);
            setFeed(feedRes.data.reports || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const todayCount = feed.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
    const dbOnline = !loading && analytics !== null;
    const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

    return (
        <DashboardLayout navItems={NAV} role="institution" userName="Dr. Adaeze Obi">
            {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>}
            {showModal && <SentinelModal onClose={() => setShowModal(false)} onSuccess={(id) => { showToast(`Report ${id} submitted`); loadData(); }} />}

            {/* ── PHO Advisory Banner ── */}
            {analytics?.advisory?.active && (
                <div className={`-mx-8 -mt-8 px-8 py-3.5 mb-5 flex items-center gap-3 ${analytics.advisory.severity === 'red' ? 'bg-red-600' : 'bg-amber-500'}`}>
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <p className="text-white text-sm font-semibold flex-1">{analytics.advisory.message}</p>
                    <span className="text-white/70 text-xs">Cannot dismiss — PHO-controlled</span>
                </div>
            )}

            {/* ── Director: EOC Reliability Banner ── */}
            {analytics?.dataQualityScore < 70 && (
                <div className="-mx-8 px-8 py-3.5 mb-5 flex items-center gap-3 bg-red-50 border-b border-red-200">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.05 3.378c.866-1.5 3.032-1.5 3.898 0l8.355 13.748zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <p className="text-red-700 text-sm font-semibold">Your facility's data quality has been flagged by EOC. Review your recent submissions. Score: {analytics.dataQualityScore}%</p>
                </div>
            )}

            {/* ── Setup Warning: No facility linked ── */}
            {analytics?._warning && (
                <div className="-mx-8 px-8 py-3.5 mb-5 flex items-center gap-3 bg-amber-50 border-b border-amber-200">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <p className="text-amber-800 text-sm font-semibold flex-1">⚠️ Setup needed: {analytics._warning}</p>
                </div>
            )}

            {/* ── Status Bar ── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${dbOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm font-bold ${dbOnline ? 'text-green-700' : 'text-red-600'}`}>{dbOnline ? 'Live' : 'Disconnected'}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-sm text-slate-600"><span className="font-bold text-slate-900">{todayCount}</span> report{todayCount !== 1 ? 's' : ''} today</span>
                </div>
            </div>

            {/* ── CTA: Sentinel Report ── */}
            <button onClick={() => setShowModal(true)}
                className="w-full mb-6 flex items-center justify-center gap-3 py-5 px-8 rounded-2xl bg-gradient-to-r from-[#1e52f1] to-[#2d6ef5] text-white font-bold text-base shadow-lg shadow-[#1e52f1]/25 hover:shadow-xl hover:scale-[1.004] active:scale-[0.998] transition-all">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </div>
                + New Sentinel Report
                <span className="ml-auto text-xs bg-white/15 px-3 py-1 rounded-full border border-white/20">Conversational form</span>
            </button>

            {/* ── Facility Health Panel ── */}
            {analytics && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 mb-6">
                    <h2 className="text-sm font-bold text-slate-800">Facility Health</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Data Quality */}
                        <div className={`rounded-2xl border p-4 ${analytics.dataQualityScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">Data Quality Score</p>
                            <p className={`text-3xl font-black mt-1 ${analytics.dataQualityScore >= 70 ? 'text-green-700' : 'text-red-700'}`}>{analytics.dataQualityScore}%</p>
                            <p className={`text-xs mt-1 ${analytics.dataQualityScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>{analytics.dataQualityScore >= 70 ? 'Above threshold' : 'Below 70% threshold'}</p>
                        </div>
                        {/* Monthly comparison */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports This Month</p>
                            <p className="text-3xl font-black text-slate-900 mt-1">{analytics.reportsThisMonth}</p>
                            <p className="text-xs text-slate-500 mt-1">vs {analytics.reportsLastMonth} last month <span className="text-green-600 font-bold">▲ {analytics.reportsThisMonth - analytics.reportsLastMonth}</span></p>
                        </div>
                        {/* EOC Flags */}
                        <div className={`rounded-2xl border p-4 ${analytics.eocFlags?.length ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">EOC Flags</p>
                            <p className={`text-3xl font-black mt-1 ${analytics.eocFlags?.length ? 'text-red-700' : 'text-green-700'}`}>{analytics.eocFlags?.length || 0}</p>
                            {analytics.eocFlags?.map((f: string) => <p key={f} className="text-xs text-red-600 mt-1 font-semibold">{f}</p>)}
                            {!analytics.eocFlags?.length && <p className="text-xs text-green-600 mt-1">No active flags</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Live Feed ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h2 className="text-sm font-bold text-slate-800">Live Report Feed</h2>
                    <span className="ml-auto text-xs text-slate-400">{feed.length} reports</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {feed.map((row: any) => (
                        <React.Fragment key={row.id}>
                            <div onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer">
                                <div className="w-14 shrink-0">
                                    <p className="text-xs font-semibold text-slate-700">{rel(row.created_at)}</p>
                                </div>
                                <div className="w-24 shrink-0">
                                    <p className="text-xs text-slate-500">{row.origin_address || 'Facility'}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 truncate">{Array.isArray(row.symptom_matrix) ? row.symptom_matrix.join(' · ') : 'Unknown'}</p>
                                </div>
                                <div className="shrink-0"><PipelineBadge status={row.status} /></div>
                                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expandedRow === row.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            {expandedRow === row.id && (
                                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Patients</p><p className="font-bold text-slate-900 text-lg">{row.patient_count}</p></div>
                                        <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Severity</p><p className="font-bold text-slate-900 text-lg">{row.severity}/10</p></div>
                                        <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Submitted</p><p className="font-bold text-slate-900 text-xs mt-1">{new Date(row.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p></div>
                                    </div>
                                    <div><p className="text-xs text-slate-400 mb-1.5">Symptoms</p><div className="flex flex-wrap gap-1.5">{Array.isArray(row.symptom_matrix) && row.symptom_matrix.map((s: string) => <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>)}</div></div>
                                    {row.notes && <p className="text-xs text-slate-500 italic">"{row.notes}"</p>}
                                    <p className="text-xs text-slate-400 italic">Editing locked after submission.</p>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    {!loading && feed.length === 0 && (
                        <div className="px-5 py-10 text-center text-slate-400 text-sm">No recent reports found.</div>
                    )}
                    {loading && (
                        <div className="px-5 py-10 text-center flex justify-center"><div className="w-5 h-5 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin"></div></div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
