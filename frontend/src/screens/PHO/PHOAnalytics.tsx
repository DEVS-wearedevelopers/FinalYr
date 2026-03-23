'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { alertsService } from '@/services/alertsService';

const NAV = [
    { label: 'Alert Inbox', href: '/dashboard/pho',            icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Analytics',   href: '/dashboard/pho/analytics',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
    { label: 'Broadcasts',  href: '/dashboard/pho/broadcasts', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
];

function CBSGauge({ value }: { value: number }) {
    const pct  = Math.min(value * 100, 100);
    const color = value >= 0.8 ? '#ef4444' : value >= 0.5 ? '#f59e0b' : '#22c55e';
    const r = 44, circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-2">
            <svg width={110} height={110} viewBox="0 0 110 110">
                <circle cx={55} cy={55} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
                <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={10}
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 1s ease' }} />
                <text x="55" y="52" textAnchor="middle" fontSize={18} fontWeight={800} fill={color}>{value.toFixed(2)}</text>
                <text x="55" y="67" textAnchor="middle" fontSize={9} fill="#94a3b8">avg CBS</text>
            </svg>
        </div>
    );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    return (
        <div className="flex items-center gap-3">
            <p className="text-xs text-slate-600 w-20 shrink-0">{label}</p>
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-700 w-6 text-right">{value}</span>
        </div>
    );
}

export default function PHOAnalytics() {
    const [trends, setTrends]   = useState<any>(null);
    const [alerts, setAlerts]   = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([alertsService.getNationalTrends(), alertsService.getInbox()])
            .then(([t, a]) => { setTrends(t); setAlerts(a); })
            .finally(() => setLoading(false));
    }, []);

    const confirmed   = alerts.filter(a => a.status === 'confirmed').length;
    const probable    = alerts.filter(a => a.status === 'probable').length;
    const investing   = alerts.filter(a => a.status === 'investigating').length;
    const pending     = alerts.filter(a => a.status === 'pending_investigation').length;
    const maxCount    = Math.max(confirmed, probable, investing, pending, 1);
    const avgCbs      = alerts.length > 0 ? alerts.reduce((s, a) => s + (a.cbs_score ?? 0), 0) / alerts.length : 0;
    const highRisk    = alerts.filter(a => a.cbs_score >= 0.8).length;
    const medRisk     = alerts.filter(a => a.cbs_score >= 0.5 && a.cbs_score < 0.8).length;
    const lowRisk     = alerts.filter(a => a.cbs_score < 0.5).length;
    const topSymptoms = Object.entries(
        alerts.flatMap(a => a.sentinel_reports?.symptom_matrix ?? [])
              .reduce((acc: Record<string, number>, s: string) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {})
    ).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 6);

    return (
        <DashboardLayout navItems={NAV} role="pho" userName="PHO">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Zone Analytics</h1>
                <p className="text-slate-500 text-sm mt-0.5">Surveillance metrics and outbreak intelligence for your zone</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-5">
                    {/* Top KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Alerts', value: alerts.length, bg: 'bg-white border-slate-200', text: 'text-slate-900' },
                            { label: 'High Risk CBS ≥ 0.8', value: highRisk, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
                            { label: 'Under Investigation', value: investing, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
                            { label: 'National (30d)', value: trends?.totalAlerts ?? '—', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
                        ].map(k => (
                            <div key={k.label} className={`rounded-2xl border p-5 ${k.bg}`}>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                                <p className={`text-3xl font-black mt-1 ${k.text}`}>{k.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* CBS gauge */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Zone Avg CBS</p>
                            <CBSGauge value={avgCbs} />
                            <div className="w-full space-y-2 mt-1">
                                <BarRow label="High risk" value={highRisk} max={alerts.length} color="bg-red-500" />
                                <BarRow label="Elevated"  value={medRisk}  max={alerts.length} color="bg-amber-400" />
                                <BarRow label="Low risk"  value={lowRisk}  max={alerts.length} color="bg-green-500" />
                            </div>
                        </div>

                        {/* Status breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Status Breakdown</p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Pending',      value: pending,   color: 'bg-slate-400' },
                                    { label: 'Investigating',value: investing,  color: 'bg-blue-500' },
                                    { label: 'Probable',     value: probable,   color: 'bg-amber-500' },
                                    { label: 'Confirmed',    value: confirmed,  color: 'bg-red-500' },
                                ].map(s => (
                                    <div key={s.label}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-600">{s.label}</span>
                                            <span className="text-xs font-bold text-slate-700">{s.value}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${s.color} transition-all duration-700`}
                                                style={{ width: `${alerts.length > 0 ? (s.value / alerts.length) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top symptoms */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Top Reported Symptoms</p>
                            {topSymptoms.length === 0 ? (
                                <p className="text-xs text-slate-300 text-center py-8">No symptom data yet</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {topSymptoms.map(([symptom, count], i) => (
                                        <div key={symptom} className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-[#1e52f1]/10 text-[#1e52f1] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between mb-0.5">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{symptom}</p>
                                                    <span className="text-xs font-bold text-slate-500 shrink-0 ml-2">{count as number}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#1e52f1] rounded-full"
                                                        style={{ width: `${topSymptoms[0] ? ((count as number) / (topSymptoms[0][1] as number)) * 100 : 0}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent high-risk alerts table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">High-Priority Alerts — CBS ≥ 0.5</p>
                            <span className="text-xs text-slate-400">{alerts.filter(a => a.cbs_score >= 0.5).length} alerts</span>
                        </div>
                        {alerts.filter(a => a.cbs_score >= 0.5).length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm">✅ No elevated-risk alerts in your zone</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {alerts.filter(a => a.cbs_score >= 0.5).slice(0, 8).map(a => (
                                    <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <span className={`text-sm font-black w-12 shrink-0 ${a.cbs_score >= 0.8 ? 'text-red-600' : 'text-amber-600'}`}>{a.cbs_score.toFixed(2)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">{a.sentinel_reports?.symptom_matrix?.join(', ') || 'Unknown'}</p>
                                            <p className="text-xs text-slate-400">{a.sentinel_reports?.patient_count ?? '?'} pts · {a.sentinel_reports?.origin_address || 'Facility'}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.status === 'confirmed' ? 'bg-red-100 text-red-700' : a.status === 'probable' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{a.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
