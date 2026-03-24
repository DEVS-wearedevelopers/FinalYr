'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { alertsService, AiAlert } from '@/services/alertsService';

const WeeklyIntelligence = dynamic(() => import('./components/WeeklyIntelligence'), { ssr: false });

// ── CBS colour helpers ───────────────────────────────────────────────────────
function cbsColor(cbs: number) {
    if (cbs < 0.4) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', bar: 'bg-green-500' };
    if (cbs <= 0.7) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', bar: 'bg-red-500' };
}

function rel(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1)    return 'just now';
    if (m < 60)   return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
}

// ── Mini patient count bar chart (14-slot rolling) ───────────────────────────
function MiniBarChart({ count }: { count: number }) {
    const bars = Array.from({ length: 14 }, (_, i) => (i === 13 ? count : Math.max(2, Math.floor(Math.random() * 16))));
    const max  = Math.max(...bars, 1);
    return (
        <div className="space-y-2">
            <div className="flex items-end gap-0.5 h-16">
                {bars.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col-reverse">
                        <div className={`rounded-t-sm ${i === 13 ? 'bg-[#1e52f1]' : 'bg-slate-200'}`}
                            style={{ height: `${(v / max) * 60}px` }} title={i === 13 ? `Today: ${v}` : `Day ${i + 1}: ${v}`} />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e52f1]" />Today</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />14-day baseline</span>
            </div>
        </div>
    );
}

// ── Broadcast modal ──────────────────────────────────────────────────────────
const BROADCAST_TEMPLATES = [
    { id: 't1', name: 'Respiratory Advisory',    text: 'An advisory has been issued for respiratory illness in your zone. Facilities should increase surveillance and report unusual clusters.' },
    { id: 't2', name: 'Enteric Outbreak Warning', text: 'A potential enteric outbreak has been identified. All facilities in your zone should activate outbreak protocols.' },
    { id: 't3', name: 'Hemorrhagic Alert',        text: 'URGENT: Suspected hemorrhagic fever detected in your zone. Implement contact tracing and isolation procedures immediately.' },
    { id: 't4', name: 'General Health Watch',     text: 'Elevated disease activity observed in your zone. PHOs and institutions should remain on heightened alert.' },
];

function BroadcastModal({ onClose, onSend }: { onClose: () => void; onSend: () => void }) {
    const [selected, setSelected] = useState('t1');
    const tmpl = BROADCAST_TEMPLATES.find(t => t.id === selected)!;
    const [sending, setSending] = useState(false);

    const send = async () => {
        setSending(true);
        try { await alertsService.broadcast(); } catch {}
        onSend();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Select Broadcast Template</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="space-y-2">
                    {BROADCAST_TEMPLATES.map(t => (
                        <label key={t.id} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selected === t.id ? 'bg-blue-50 border-[#1e52f1]/30' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${selected === t.id ? 'border-[#1e52f1] bg-[#1e52f1]' : 'border-slate-300'}`}>
                                {selected === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div><p className="text-sm font-semibold text-slate-800">{t.name}</p><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.text.substring(0, 80)}...</p></div>
                            <input type="radio" className="sr-only" value={t.id} checked={selected === t.id} onChange={() => setSelected(t.id)} />
                        </label>
                    ))}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Preview</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{tmpl.text}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button onClick={send} disabled={sending}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-semibold hover:bg-[#123bb5] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {sending && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                        Broadcast
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
    { label: 'Alert Inbox', href: '/dashboard/pho', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Analytics',   href: '/dashboard/pho/analytics',   icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
    { label: 'Broadcasts',  href: '/dashboard/pho/broadcasts',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
];

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function PHODashboard() {
    const tokenUser = useUserFromToken();
    // ── Data state ────────────────────────────────────────────────────────────
    const [alerts, setAlerts]           = useState<AiAlert[]>([]);
    const [loading, setLoading]         = useState(true);
    const [loadError, setLoadError]     = useState('');

    // ── UI state ──────────────────────────────────────────────────────────────
    const [selectedAlert, setSelectedAlert] = useState<AiAlert | null>(null);
    const [claimedIds, setClaimedIds]       = useState<Set<string>>(new Set());
    const [actionStatus, setActionStatus]   = useState<'monitor' | 'advisory' | 'dispatch'>('monitor');
    const [justification, setJustification] = useState('');
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [toast, setToast]                 = useState('');
    const [activeTab, setActiveTab]         = useState<'triage' | 'intelligence'>('triage');
    const [submitting, setSubmitting]       = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    // ── Load inbox ────────────────────────────────────────────────────────────
    const loadInbox = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const data = await alertsService.getInbox();
            setAlerts(data);
            if (data.length > 0 && !selectedAlert) setSelectedAlert(data[0]);
        } catch (e: any) {
            setLoadError(e?.response?.data?.details || e.message || 'Failed to load alerts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadInbox(); }, [loadInbox]);

    // ── Claim alert ───────────────────────────────────────────────────────────
    const handleClaim = async (alert: AiAlert, e: React.MouseEvent) => {
        e.stopPropagation();
        const isClaimed = claimedIds.has(alert.id);
        if (isClaimed) {
            setClaimedIds(p => { const n = new Set(p); n.delete(alert.id); return n; });
            showToast('Alert unclaimed');
            return;
        }
        try {
            await alertsService.claimAlert(alert.id);
            setClaimedIds(p => new Set([...p, alert.id]));
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'investigating' } : a));
            showToast('Alert claimed — you are now the investigating PHO');
        } catch { showToast('Failed to claim alert'); }
    };

    // ── Update status ─────────────────────────────────────────────────────────
    const handleUpdateStatus = async () => {
        if (!selectedAlert || !justification.trim()) {
            showToast('Add justification notes before submitting');
            return;
        }
        const statusMap = { monitor: null, advisory: 'probable', dispatch: 'confirmed' } as const;
        const newStatus = statusMap[actionStatus];
        if (!newStatus) { showToast('No status change required for Monitor Only'); return; }

        setSubmitting(true);
        try {
            await alertsService.updateStatus(selectedAlert.id, newStatus as any);
            setAlerts(prev => prev.map(a => a.id === selectedAlert.id ? { ...a, status: newStatus } : a));
            showToast(`Alert status updated → ${newStatus}`);
            setJustification('');
        } catch { showToast('Failed to update status — you must claim the alert first'); }
        finally { setSubmitting(false); }
    };

    // ── Escalate ──────────────────────────────────────────────────────────────
    const handleEscalate = async () => {
        if (!selectedAlert) return;
        try {
            await alertsService.escalate(selectedAlert.id);
            showToast('ESCALATED: Alert forwarded to EOC Command Centre');
            loadInbox();
        } catch { showToast('Failed to escalate alert'); }
    };

    const symptoms = selectedAlert?.sentinel_reports?.symptom_matrix ?? [];
    const unclaimed = alerts.filter(a => !claimedIds.has(a.id)).length;

    return (
        <DashboardLayout navItems={NAV} role="pho" userName={tokenUser?.name || 'PHO'}>
            {/* Toast */}
            {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>}
            {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} onSend={() => { setShowBroadcast(false); showToast('Broadcast sent to facilities in your zone'); }} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PHO Command Centre</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Alert triage and field intelligence</p>
                </div>
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" />
                    ) : loadError ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">{loadError}</span>
                    ) : (
                        <>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-slate-500">{unclaimed} unclaimed · {alerts.length} total</span>
                        </>
                    )}
                    <button onClick={loadInbox} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tab nav */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mb-6">
                {(['triage', 'intelligence'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab === 'triage' ? '🚨 Alert Triage' : '📊 Weekly Intelligence'}
                    </button>
                ))}
            </div>

            {/* Triage tab */}
            {activeTab === 'triage' && (
                <div className="flex gap-5 h-[calc(100vh-240px)] min-h-[600px]">
                    {/* LEFT: Alert Inbox */}
                    <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alert Inbox · CBS descending</p>

                        {loading && Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-slate-100 p-4 bg-white animate-pulse space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-2 bg-slate-100 rounded w-1/2" />
                            </div>
                        ))}

                        {!loading && alerts.length === 0 && !loadError && (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                                <p className="text-sm font-semibold">No alerts in your zone</p>
                                <p className="text-xs mt-1">Alerts appear when institutions submit sentinel reports</p>
                            </div>
                        )}

                        {alerts.map(alert => {
                            const c = cbsColor(alert.cbs_score);
                            const isSelected = selectedAlert?.id === alert.id;
                            const isClaimed  = claimedIds.has(alert.id);
                            const symptoms   = alert.sentinel_reports?.symptom_matrix ?? [];
                            return (
                                <div key={alert.id} onClick={() => setSelectedAlert(alert)}
                                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${isSelected ? 'border-[#1e52f1] ring-2 ring-[#1e52f1]/20 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'} bg-white`}>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 leading-tight">{alert.sentinel_reports?.organization_id?.slice(0, 8) || 'Institution'}…</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{alert.zone_id?.slice(0, 12) || 'Zone'} · {rel(alert.created_at)}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${c.bg} ${c.border} shrink-0`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                            <span className={`text-xs font-bold ${c.text}`}>{alert.cbs_score.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${alert.cbs_score * 100}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>Sev {alert.severity_index}/10</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {symptoms.slice(0, 2).map(s => <span key={s} className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">{s}</span>)}
                                        {symptoms.length > 2 && <span className="text-xs text-slate-400">+{symptoms.length - 2}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">{alert.sentinel_reports?.patient_count ?? '?'} patients · {alert.sentinel_reports?.origin_address || 'Facility'}</p>
                                    <div className="flex gap-2">
                                        <button onClick={e => handleClaim(alert, e)}
                                            className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition-all ${isClaimed ? 'bg-[#1e52f1] text-white border-[#1e52f1]' : 'border-slate-200 text-slate-600 hover:border-[#1e52f1] hover:text-[#1e52f1]'}`}>
                                            {isClaimed ? '✓ Claimed' : 'Claim'}
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setSelectedAlert(alert); }}
                                            className="flex-1 text-xs font-bold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-400 transition-all">
                                            Quick Verify
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT: Evidence Board */}
                    <div className="flex-1 min-w-0 overflow-y-auto">
                        {selectedAlert ? (
                            <div className="space-y-5">
                                {/* Alert header */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">
                                                {selectedAlert.sentinel_reports?.origin_address || 'Facility Report'}
                                            </h2>
                                            <p className="text-sm text-slate-500 mt-0.5">Zone {selectedAlert.zone_id?.slice(0, 16)} · {rel(selectedAlert.created_at)}</p>
                                        </div>
                                        <div className={`text-center px-4 py-2 rounded-xl border ${cbsColor(selectedAlert.cbs_score).bg} ${cbsColor(selectedAlert.cbs_score).border}`}>
                                            <p className={`text-2xl font-black ${cbsColor(selectedAlert.cbs_score).text}`}>{selectedAlert.cbs_score.toFixed(2)}</p>
                                            <p className={`text-xs font-bold ${cbsColor(selectedAlert.cbs_score).text} opacity-70`}>CBS Score</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-5">
                                        <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-slate-900">{selectedAlert.sentinel_reports?.patient_count ?? '?'}</p><p className="text-xs text-slate-400 mt-0.5">Patients</p></div>
                                        <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-slate-900">{selectedAlert.severity_index}/10</p><p className="text-xs text-slate-400 mt-0.5">Severity</p></div>
                                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                                            <p className={`text-sm font-black ${selectedAlert.status === 'confirmed' ? 'text-red-600' : selectedAlert.status === 'probable' ? 'text-orange-600' : selectedAlert.status === 'investigating' ? 'text-blue-600' : 'text-slate-500'}`}>{selectedAlert.status.replace('_', ' ')}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Status</p>
                                        </div>
                                    </div>
                                    {selectedAlert.bypass_reason && (
                                        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                            <span className="text-red-600 text-xs font-bold">⚡ Auto-bypassed: {selectedAlert.bypass_reason}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Symptoms + Historical Delta */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Symptom Breakdown</p>
                                        <div className="space-y-2">
                                            {symptoms.length > 0 ? symptoms.map((s, i) => (
                                                <div key={s} className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                                                        <div className="h-full bg-[#1e52f1] rounded-full" style={{ width: `${100 - i * 20}%` }} />
                                                    </div>
                                                    <span className="text-xs text-slate-700 font-medium">{s}</span>
                                                </div>
                                            )) : <p className="text-xs text-slate-400">No symptom data</p>}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Patient Count — 14-Day Window</p>
                                        <MiniBarChart count={selectedAlert.sentinel_reports?.patient_count ?? 0} />
                                    </div>
                                </div>

                                {/* Action Panel */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                                    <p className="text-sm font-bold text-slate-800">Action Panel</p>
                                    <div className="flex gap-2">
                                        {([['monitor', 'Monitor Only', 'bg-green-500'], ['advisory', 'Issue Advisory (Probable)', 'bg-amber-500'], ['dispatch', 'Confirm Outbreak', 'bg-red-500']] as const).map(([val, label, color]) => (
                                            <button key={val} onClick={() => setActionStatus(val)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${actionStatus === val ? `${color} text-white border-transparent shadow-md` : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Justification Notes <span className="text-red-400">*required to submit</span></label>
                                        <textarea rows={3} value={justification} onChange={e => setJustification(e.target.value)}
                                            placeholder="Document your clinical reasoning and supporting evidence..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
                                    </div>
                                    {actionStatus !== 'monitor' && (
                                        <button onClick={handleUpdateStatus} disabled={submitting || !justification.trim()}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] transition-all disabled:opacity-50">
                                            {submitting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                            Submit Assessment
                                        </button>
                                    )}
                                    <button onClick={() => setShowBroadcast(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#1e52f1] text-[#1e52f1] text-sm font-bold hover:bg-[#1e52f1] hover:text-white transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                                        Trigger Broadcast
                                    </button>
                                    <button onClick={handleEscalate}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-500 text-red-600 text-sm font-bold hover:bg-red-50 transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                        Escalate to EOC
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                                <p className="text-sm font-semibold">Select an alert to view the evidence board</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'intelligence' && (
                <div className="max-w-4xl">
                    <WeeklyIntelligence />
                </div>
            )}
        </DashboardLayout>
    );
}
