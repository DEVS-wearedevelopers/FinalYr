'use client';
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';

const SentinelModal = dynamic(() => import('./components/SentinelModal'), { ssr: false });

// ── Mock data ──────────────────────────────────────────────────────────────────
const NOW = Date.now();
type FeedStatus = 'pending_ai' | 'ai_scored' | 'pho_review' | 'validated' | 'dismissed';
interface FeedRow { id: string; time: string; location: string; symptom: string; status: FeedStatus; cbs?: number; count: number; symptoms: string[]; severity: number; notes: string; }
const FEED: FeedRow[] = [
    { id: 'r1', time: new Date(NOW - 1800000).toISOString(), location: 'Ward 3', symptom: 'Cough · Fever', status: 'ai_scored', cbs: 0.74, count: 8, symptoms: ['Cough', 'Fever', 'Shortness of Breath'], severity: 6, notes: 'Three patients with SpO₂ below 94%. Kept under observation.' },
    { id: 'r2', time: new Date(NOW - 7200000).toISOString(), location: 'OPD', symptom: 'Diarrhea · Vomiting', status: 'pho_review', count: 23, symptoms: ['Diarrhea', 'Vomiting', 'Abdominal Pain'], severity: 8, notes: 'Cluster in OPD morning queue. 3 patients admitted.' },
    { id: 'r3', time: new Date(NOW - 86400000).toISOString(), location: 'Emergency', symptom: 'Bleeding (Nose)', status: 'validated', cbs: 0.31, count: 3, symptoms: ['Bleeding (Nose)', 'Rash', 'Fever'], severity: 8, notes: '' },
    { id: 'r4', time: new Date(NOW - 172800000).toISOString(), location: 'Maternity', symptom: 'Headache', status: 'pending_ai', count: 5, symptoms: ['Headache', 'Dizziness'], severity: 4, notes: '' },
    { id: 'r5', time: new Date(NOW - 259200000).toISOString(), location: 'Lab', symptom: 'Rash', status: 'dismissed', cbs: 0.12, count: 2, symptoms: ['Rash'], severity: 2, notes: 'Suspected allergic reaction post-sample collection.' },
];
const STAFF_DATA = [
    { id: 's1', name: 'Nurse Bello Musa', role: 'Staff Nurse', reports: 3, last: '30m ago', status: 'active' },
    { id: 's2', name: 'Mr. Chidi Eze', role: 'Lab Officer', reports: 1, last: '6h ago', status: 'active' },
    { id: 's3', name: 'Dr. Funke Ajayi', role: 'Registrar', reports: 0, last: '3d ago', status: 'inactive' },
    { id: 's4', name: 'Nurse Aisha Saleh', role: 'ER Nurse', reports: 5, last: '1h ago', status: 'active' },
];
const PHO_ADVISORY = { active: true, severity: 'amber' as const, message: 'PHO Advisory — Zone SW-03: Elevated Respiratory cases confirmed. Increase triage vigilance.' };
const RELIABILITY_SCORE = 62; // below 70 → director sees EOC banner
const EOC_FLAGS = ['Audit Initiated — 2026-02-28'];
const FACILITY_HEALTH = { dataQualityScore: RELIABILITY_SCORE, reportsThisMonth: 47, reportsLastMonth: 38, eocFlags: EOC_FLAGS };

// ── Utils ──────────────────────────────────────────────────────────────────────
function rel(iso: string) {
    const d = Math.floor((NOW - new Date(iso).getTime()) / 60000);
    if (d < 60) return `${d}m ago`;
    if (d < 1440) return `${Math.floor(d / 60)}h ago`;
    return `${Math.floor(d / 1440)}d ago`;
}

// ── Status badge ───────────────────────────────────────────────────────────────
function PipelineBadge({ status, cbs }: { status: FeedStatus; cbs?: number }) {
    if (status === 'pending_ai') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">Pending AI Scan</span>;
    if (status === 'ai_scored') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">AI Scored — CBS: {cbs?.toFixed(2)}</span>;
    if (status === 'pho_review') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">Under PHO Review</span>;
    if (status === 'validated') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">Validated</span>;
    if (status === 'dismissed') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-50 text-slate-400 border border-slate-100">Dismissed</span>;
    return null;
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV = [
    { label: 'Overview', href: '/dashboard/institution', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports', href: '/dashboard/reports', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Alerts', href: '/dashboard/alerts', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
];

// ── Main ───────────────────────────────────────────────────────────────────────
export default function InstitutionDashboard() {
    const [isDirector, setIsDirector] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [staff, setStaff] = useState(STAFF_DATA);
    const [toast, setToast] = useState('');

    const todayCount = FEED.filter(r => new Date(r.time).toDateString() === new Date().toDateString()).length;
    const dbOnline = true;
    const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

    return (
        <DashboardLayout navItems={NAV} role="institution" userName={isDirector ? 'Dr. Adaeze Obi' : 'Nurse Bello Musa'}>
            {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>}
            {showModal && <SentinelModal onClose={() => setShowModal(false)} onSuccess={id => showToast(`Report ${id} submitted`)} />}

            {/* ── PHO Advisory Banner ── */}
            {PHO_ADVISORY.active && (
                <div className={`-mx-8 -mt-8 px-8 py-3.5 mb-5 flex items-center gap-3 ${PHO_ADVISORY.severity === 'red' ? 'bg-red-600' : 'bg-amber-500'}`}>
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <p className="text-white text-sm font-semibold flex-1">{PHO_ADVISORY.message}</p>
                    <span className="text-white/70 text-xs">Cannot dismiss — PHO-controlled</span>
                </div>
            )}

            {/* ── Director: EOC Reliability Banner ── */}
            {isDirector && RELIABILITY_SCORE < 70 && (
                <div className="-mx-8 px-8 py-3.5 mb-5 flex items-center gap-3 bg-red-50 border-b border-red-200">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.05 3.378c.866-1.5 3.032-1.5 3.898 0l8.355 13.748zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <p className="text-red-700 text-sm font-semibold">Your facility's data quality has been flagged by EOC. Review your recent submissions. Score: {RELIABILITY_SCORE}%</p>
                </div>
            )}

            {/* ── Status Bar + role toggle ── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${dbOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm font-bold ${dbOnline ? 'text-green-700' : 'text-red-600'}`}>{dbOnline ? 'Live' : 'Disconnected'}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-sm text-slate-600"><span className="font-bold text-slate-900">{todayCount}</span> report{todayCount !== 1 ? 's' : ''} today</span>
                </div>
                <button onClick={() => setIsDirector(d => !d)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${isDirector ? 'bg-[#1e52f1] text-white border-[#1e52f1]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    {isDirector ? 'Director View' : 'Staff View'}
                </button>
            </div>

            {/* ════ STAFF VIEW ════════════════════════════════════════════════════ */}
            {!isDirector && (
                <>
                    {/* CTA */}
                    <button onClick={() => setShowModal(true)}
                        className="w-full mb-6 flex items-center justify-center gap-3 py-5 px-8 rounded-2xl bg-gradient-to-r from-[#1e52f1] to-[#2d6ef5] text-white font-bold text-base shadow-lg shadow-[#1e52f1]/25 hover:shadow-xl hover:scale-[1.004] active:scale-[0.998] transition-all">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        + New Sentinel Report
                        <span className="ml-auto text-xs bg-white/15 px-3 py-1 rounded-full border border-white/20">Conversational form</span>
                    </button>

                    {/* Live Feed */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <h2 className="text-sm font-bold text-slate-800">Live Report Feed</h2>
                            <span className="ml-auto text-xs text-slate-400">{FEED.length} reports</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {FEED.map(row => (
                                <React.Fragment key={row.id}>
                                    <div onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer">
                                        <div className="w-14 shrink-0">
                                            <p className="text-xs font-semibold text-slate-700">{rel(row.time)}</p>
                                        </div>
                                        <div className="w-24 shrink-0">
                                            <p className="text-xs text-slate-500">{row.location}</p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">{row.symptom}</p>
                                        </div>
                                        <div className="shrink-0"><PipelineBadge status={row.status} cbs={row.cbs} /></div>
                                        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expandedRow === row.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {expandedRow === row.id && (
                                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Patients</p><p className="font-bold text-slate-900 text-lg">{row.count}</p></div>
                                                <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Severity</p><p className="font-bold text-slate-900 text-lg">{row.severity}/10</p></div>
                                                <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Submitted</p><p className="font-bold text-slate-900 text-xs mt-1">{new Date(row.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p></div>
                                            </div>
                                            <div><p className="text-xs text-slate-400 mb-1.5">Symptoms</p><div className="flex flex-wrap gap-1.5">{row.symptoms.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>)}</div></div>
                                            {row.notes && <p className="text-xs text-slate-500 italic">"{row.notes}"</p>}
                                            <p className="text-xs text-slate-400 italic">Editing locked after submission.</p>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ════ DIRECTOR VIEW ═════════════════════════════════════════════════ */}
            {isDirector && (
                <>
                    {/* Staff Activity Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-800">Staff Activity</h2>
                            <span className="text-xs text-slate-400">{staff.length} members</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                                    <th className="px-5 py-3 text-left">Name</th>
                                    <th className="px-5 py-3 text-left">Role</th>
                                    <th className="px-5 py-3 text-left">Reports This Week</th>
                                    <th className="px-5 py-3 text-left">Last Submission</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-left">Action</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-50">
                                    {staff.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/60">
                                            <td className="px-5 py-3.5 font-semibold text-slate-900 text-xs">{s.name}</td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">{s.role}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#1e52f1] rounded-full" style={{ width: `${(s.reports / 7) * 100}%` }} /></div>
                                                    <span className="text-xs font-bold text-slate-700">{s.reports}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-400">{s.last}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                    {s.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <button onClick={() => { setStaff(p => p.map(x => x.id === s.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x)); showToast(`${s.name} ${s.status === 'active' ? 'deactivated' : 'activated'}`); }}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${s.status === 'active' ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'}`}>
                                                    {s.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Facility Health Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                        <h2 className="text-sm font-bold text-slate-800">Facility Health</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Data Quality */}
                            <div className={`rounded-2xl border p-4 ${FACILITY_HEALTH.dataQualityScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className="text-xs font-bold opacity-70 uppercase tracking-wide">Data Quality Score</p>
                                <p className={`text-3xl font-black mt-1 ${FACILITY_HEALTH.dataQualityScore >= 70 ? 'text-green-700' : 'text-red-700'}`}>{FACILITY_HEALTH.dataQualityScore}%</p>
                                <p className={`text-xs mt-1 ${FACILITY_HEALTH.dataQualityScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>{FACILITY_HEALTH.dataQualityScore >= 70 ? 'Above threshold' : 'Below 70% threshold'}</p>
                            </div>
                            {/* Monthly comparison */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports This Month</p>
                                <p className="text-3xl font-black text-slate-900 mt-1">{FACILITY_HEALTH.reportsThisMonth}</p>
                                <p className="text-xs text-slate-500 mt-1">vs {FACILITY_HEALTH.reportsLastMonth} last month <span className="text-green-600 font-bold">▲ {FACILITY_HEALTH.reportsThisMonth - FACILITY_HEALTH.reportsLastMonth}</span></p>
                            </div>
                            {/* EOC Flags */}
                            <div className={`rounded-2xl border p-4 ${FACILITY_HEALTH.eocFlags.length ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                <p className="text-xs font-bold opacity-70 uppercase tracking-wide">EOC Flags</p>
                                <p className={`text-3xl font-black mt-1 ${FACILITY_HEALTH.eocFlags.length ? 'text-red-700' : 'text-green-700'}`}>{FACILITY_HEALTH.eocFlags.length}</p>
                                {FACILITY_HEALTH.eocFlags.map(f => <p key={f} className="text-xs text-red-600 mt-1 font-semibold">{f}</p>)}
                                {!FACILITY_HEALTH.eocFlags.length && <p className="text-xs text-green-600 mt-1">No active flags</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
