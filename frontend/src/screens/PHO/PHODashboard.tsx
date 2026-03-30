'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import AiAnalysisPanel from '@/components/AiAnalysisPanel';
import {
  mockGetAlerts, mockClaimAlert, mockUpdateAlertStatus, mockEscalateAlert,
  mockSendBroadcast, mockGetBroadcasts, mockDeleteAlert, mockReverseAlert,
  BROADCAST_TEMPLATES,
  type AiAlert, type Broadcast, type BroadcastType,
} from '@/services/mockData';
import { useMockSync } from '@/hooks/useMockSync';
import { useWsSync } from '@/hooks/useWsSync';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

const PHOLiveMap = dynamic(() => import('./PHOLiveMap'), { ssr: false });

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  {
    label: 'Alert Inbox', href: '/dashboard/pho',
    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    label: 'Broadcasts', href: '/dashboard/pho/broadcasts',
    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    label: 'Live Map', href: '/dashboard/pho/analytics',
    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cbsColor(cbs: number) {
  if (cbs < 0.45) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', bar: 'bg-green-500' };
  if (cbs <= 0.7) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', bar: 'bg-red-500' };
}

function rel(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

// ─── Broadcast Modal ──────────────────────────────────────────────────────────
function BroadcastModal({ issuerName, onClose, onSent }: {
  issuerName: string;
  onClose: () => void;
  onSent: (bc: Broadcast) => void;
}) {
  const [selected, setSelected] = useState(BROADCAST_TEMPLATES[0].id);
  const [sending, setSending]   = useState(false);
  const tmpl = BROADCAST_TEMPLATES.find(t => t.id === selected)!;

  const send = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 700));
    const bc = mockSendBroadcast({
      type: tmpl.type as BroadcastType,
      title: tmpl.name,
      message: tmpl.text,
      issuerName,
      zone: 'Lagos Island / V.I.',
    });
    onSent(bc);
  };

  const lockdownTemplate = BROADCAST_TEMPLATES.find(t => t.type === 'lockdown')!;
  const isLockdown = tmpl.type === 'lockdown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-7 py-5 flex items-center justify-between ${isLockdown ? 'bg-purple-700' : 'bg-white border-b border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isLockdown ? 'bg-white/20' : 'bg-[#1e52f1]'}`}>
              {tmpl.icon}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLockdown ? 'text-white' : 'text-slate-900'}`}>Issue PHO Broadcast</h3>
              <p className={`text-xs ${isLockdown ? 'text-purple-200' : 'text-slate-400'}`}>Zone: Lagos Island / V.I.</p>
            </div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLockdown ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'} hover:opacity-80`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-7 py-5 space-y-4">
          {/* Lockdown CTA — prominent */}
          <div
            onClick={() => setSelected(lockdownTemplate.id)}
            className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
              selected === lockdownTemplate.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-purple-200 bg-white hover:border-purple-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🔒</span>
              <p className="text-sm font-black text-purple-900">Zone Lockdown — Highly Contagious</p>
              <span className="ml-auto text-xs font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">CRITICAL</span>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">Residents on lockdown. Non-emergency movement prohibited. Outbreak response activated.</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"/>
            <span className="text-xs text-slate-400 font-medium">or choose advisory type</span>
            <div className="flex-1 h-px bg-slate-200"/>
          </div>

          {/* Other templates */}
          <div className="space-y-2">
            {BROADCAST_TEMPLATES.filter(t => t.type !== 'lockdown').map(t => (
              <label key={t.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selected === t.id ? 'bg-blue-50 border-[#1e52f1]/40' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${selected === t.id ? 'border-[#1e52f1] bg-[#1e52f1]' : 'border-slate-300'}`}>
                  {selected === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.icon} {t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.text.substring(0, 85)}…</p>
                </div>
                <input type="radio" className="sr-only" value={t.id} checked={selected === t.id} onChange={() => setSelected(t.id)} />
              </label>
            ))}
          </div>

          {/* Preview */}
          <div className={`rounded-xl p-4 border ${isLockdown ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-bold uppercase mb-1.5 ${isLockdown ? 'text-purple-600' : 'text-slate-500'}`}>📋 Message Preview</p>
            <p className={`text-sm leading-relaxed ${isLockdown ? 'text-purple-900 font-medium' : 'text-slate-700'}`}>{tmpl.text}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              onClick={send} disabled={sending}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                isLockdown ? 'bg-purple-700 hover:bg-purple-800' : 'bg-[#1e52f1] hover:bg-[#1640cc]'
              }`}
            >
              {sending && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
              {sending ? 'Sending…' : isLockdown ? '🔒 Issue Lockdown' : '📢 Broadcast Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function PHODashboard() {
  const tokenUser = useUserFromToken();
  const userName = tokenUser?.name || 'Dr. Amaka Osei';

  const [activeTab, setActiveTab]   = useState<'triage' | 'broadcasts' | 'map'>('triage');
  const [alerts, setAlerts]         = useState<AiAlert[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [selected, setSelected]     = useState<AiAlert | null>(null);
  const [claimedIds, setClaimed]    = useState<Set<string>>(new Set());
  const [action, setAction]         = useState<'monitor' | 'advisory' | 'dispatch' | 'validate'>('monitor');
  const [justification, setJust]    = useState('');
  const [showBc, setShowBc]         = useState(false);
  const [toast, setToast]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const data = mockGetAlerts();
    setAlerts(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
    setBroadcasts(mockGetBroadcasts());
  };

  useMockSync(load);       // same-tab + cross-tab (same browser)
  useWsSync(load);         // same-network local demo fallback
  useSupabaseSync(load);   // ✅ cross-device: phone ↔ PC via Vercel

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleDeleteAlert = (alertId: string) => {
    mockDeleteAlert(alertId);
    setAlerts(mockGetAlerts());
    setSelected(null);
    showToast('Alert invalidated and removed');
  };

  const handleReverseAlert = (alertId: string) => {
    mockReverseAlert(alertId);
    const refreshed = mockGetAlerts();
    setAlerts(refreshed);
    const found = refreshed.find(a => a.id === alertId);
    setSelected(found ?? refreshed[0] ?? null);
    showToast('Alert reversed to pending investigation');
  };

  const handleClaim = (alert: AiAlert, e: React.MouseEvent) => {
    e.stopPropagation();
    if (claimedIds.has(alert.id)) {
      setClaimed(p => { const n = new Set(p); n.delete(alert.id); return n; });
      showToast('Alert unclaimed');
      return;
    }
    const updated = mockClaimAlert(alert.id, 'usr-pho-001');
    setClaimed(p => new Set([...p, alert.id]));
    setAlerts(prev => prev.map(a => a.id === alert.id ? updated : a));
    if (selected?.id === alert.id) setSelected(updated);
    showToast('Alert claimed — you are now the investigating PHO');
  };

  const handleUpdateStatus = async () => {
    if (!selected || !justification.trim()) { showToast('Add justification notes before submitting'); return; }
    const statusMap = { monitor: null, advisory: 'probable', dispatch: 'confirmed', validate: 'invalidated' } as const;
    const newStatus = statusMap[action] as AiAlert['status'] | null;
    if (!newStatus) { showToast('Monitor only — no status change submitted'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    const updated = mockUpdateAlertStatus(selected.id, newStatus, justification);
    setAlerts(prev => prev.map(a => a.id === selected.id ? updated : a));
    setSelected(updated);
    showToast(`Alert updated → ${newStatus}`);
    setJust('');
    setSubmitting(false);
  };

  const handleEscalate = () => {
    if (!selected) return;
    mockEscalateAlert(selected.id);
    showToast('ESCALATED: Alert forwarded to EOC Command Centre');
  };

  const symptoms  = selected?.sentinel_reports?.symptom_matrix ?? [];
  const unclaimed = alerts.filter(a => !claimedIds.has(a.id)).length;

  return (
    <DashboardLayout navItems={NAV} role="pho" userName={userName}>
      {toast && (
        <div className="fixed top-5 right-5 z-[300] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-pulse">
          {toast}
        </div>
      )}
      {showBc && (
        <BroadcastModal
          issuerName={userName}
          onClose={() => setShowBc(false)}
          onSent={bc => {
            setShowBc(false);
            setBroadcasts(mockGetBroadcasts());
            showToast(bc.type === 'lockdown' ? `🔒 LOCKDOWN issued for Zone: ${bc.zone}` : `📢 "${bc.title}" sent`);
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PHO Command Centre</h1>
          <p className="text-slate-500 text-sm mt-0.5">Alert triage · AI analysis · broadcast · field map</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">{unclaimed} unclaimed · {alerts.length} total</span>
          </div>
          <button onClick={() => setShowBc(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] shadow-lg shadow-[#1e52f1]/30 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Broadcast
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mb-6">
        {([
          ['triage',     '🚨 Alert Triage'],
          ['broadcasts', '📢 Broadcasts'],
          ['map',        '🗺️ Live Map'],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ──────────── TRIAGE TAB ──────────── */}
      {activeTab === 'triage' && (
        <div className="space-y-5">
          {/* AI Analysis */}
          <AiAnalysisPanel onBroadcast={() => setShowBc(true)} />

          <div className="flex gap-5 min-h-[580px]">
            {/* LEFT: Alert list */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: '70vh' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Inbox · CBS desc.</p>
              {alerts.length === 0 && (
                <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No alerts yet</div>
              )}
              {alerts.map(alert => {
                const c = cbsColor(alert.cbs_score);
                const isSelected = selected?.id === alert.id;
                const isClaimed  = claimedIds.has(alert.id);
                return (
                  <div key={alert.id} onClick={() => setSelected(alert)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all bg-white ${
                      isSelected ? 'border-[#1e52f1] ring-2 ring-[#1e52f1]/20 shadow-md' : 'border-slate-200 hover:shadow-sm hover:border-slate-300'
                    }`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                          {alert.sentinel_reports?.origin_address?.split(',')[0] || 'Facility'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{rel(alert.created_at)}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${c.bg} ${c.border} shrink-0`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <span className={`text-xs font-bold ${c.text}`}>{alert.cbs_score.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${alert.cbs_score * 100}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(alert.sentinel_reports?.symptom_matrix ?? []).slice(0, 2).map(s => (
                        <span key={s} className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        alert.status === 'confirmed'    ? 'bg-red-50 text-red-700 border-red-200' :
                        alert.status === 'probable'     ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        alert.status === 'investigating'? 'bg-blue-50 text-blue-700 border-blue-200' :
                        alert.status === 'invalidated'  ? 'bg-slate-100 text-slate-400 border-slate-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{alert.status.replace(/_/g, ' ')}</span>
                      {alert.bypass_reason && <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">⚡ AUTO</span>}
                    </div>
                    <button onClick={e => handleClaim(alert, e)}
                      className={`w-full text-xs font-bold py-1.5 rounded-xl border transition-all ${isClaimed ? 'bg-[#1e52f1] text-white border-[#1e52f1]' : 'border-slate-200 text-slate-600 hover:border-[#1e52f1] hover:text-[#1e52f1]'}`}>
                      {isClaimed ? '✓ Claimed' : 'Claim'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: Evidence Board */}
            <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
              {selected ? (
                <>
                  {/* Alert header */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selected.sentinel_reports?.origin_address || 'Facility Report'}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Zone {selected.zone_id} · {rel(selected.created_at)}</p>
                      </div>
                      <div className={`text-center px-4 py-2 rounded-xl border ${cbsColor(selected.cbs_score).bg} ${cbsColor(selected.cbs_score).border}`}>
                        <p className={`text-2xl font-black ${cbsColor(selected.cbs_score).text}`}>{selected.cbs_score.toFixed(2)}</p>
                        <p className={`text-xs font-bold ${cbsColor(selected.cbs_score).text} opacity-70`}>CBS Score</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-5">
                      <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-slate-900">{selected.sentinel_reports?.patient_count ?? '?'}</p><p className="text-xs text-slate-400 mt-0.5">Patients</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-slate-900">{selected.severity_index}/10</p><p className="text-xs text-slate-400 mt-0.5">Severity</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className={`text-sm font-black ${selected.status === 'confirmed' ? 'text-red-600' : selected.status === 'probable' ? 'text-orange-600' : selected.status === 'investigating' ? 'text-blue-600' : 'text-slate-500'}`}>
                          {selected.status.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Status</p>
                      </div>
                    </div>
                    {selected.bypass_reason && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                        <span className="text-red-600 text-xs font-bold">⚡ Auto-bypassed: {selected.bypass_reason}</span>
                      </div>
                    )}
                    {selected.justification && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                        <p className="text-xs font-bold text-blue-700 mb-1">PHO Justification</p>
                        <p className="text-xs text-blue-800">{selected.justification}</p>
                      </div>
                    )}
                  </div>

                  {/* Symptoms */}
                  {symptoms.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Symptom Breakdown</p>
                      <div className="space-y-2">
                        {symptoms.map((s, i) => (
                          <div key={s} className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                              <div className="h-full bg-[#1e52f1] rounded-full" style={{ width: `${100 - i * 18}%` }} />
                            </div>
                            <span className="text-xs text-slate-700 font-medium">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Panel */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <p className="text-sm font-bold text-slate-800">PHO Action Panel</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['monitor',  'Monitor Only',      'bg-green-500'],
                        ['advisory', 'Issue Advisory',    'bg-amber-500'],
                        ['dispatch', 'Confirm Outbreak',  'bg-red-500'],
                        ['validate', 'Invalidate Alert',  'bg-slate-500'],
                      ] as const).map(([val, label, color]) => (
                        <button key={val} onClick={() => setAction(val)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${action === val ? `${color} text-white border-transparent shadow-md` : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Justification Notes <span className="text-red-400">*required</span></label>
                      <textarea rows={3} value={justification} onChange={e => setJust(e.target.value)}
                        placeholder="Document your clinical reasoning and supporting evidence..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
                    </div>
                    {action !== 'monitor' && (
                      <button onClick={handleUpdateStatus} disabled={submitting || !justification.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] transition-all disabled:opacity-50">
                        {submitting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
                        Submit Assessment
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setShowBc(true)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#1e52f1] text-[#1e52f1] text-xs font-bold hover:bg-[#1e52f1] hover:text-white transition-all">
                        📢 Broadcast
                      </button>
                      <button onClick={handleEscalate}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-500 text-red-600 text-xs font-bold hover:bg-red-50 transition-all">
                        🚨 Escalate EOC
                      </button>
                    </div>
                    {/* Reverse / Delete row */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleReverseAlert(selected.id)}
                        title="Reset this alert back to pending investigation for re-triage"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all">
                        ↩ Reverse
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(selected.id)}
                        title="Permanently invalidate and remove this alert"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-500 text-xs font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all">
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p className="text-sm font-semibold">Select an alert to view evidence board</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────── BROADCASTS TAB ──────────── */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Active &amp; Past Broadcasts</h2>
            <button onClick={() => setShowBc(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc]">
              + New Broadcast
            </button>
          </div>
          <div className="space-y-3">
            {broadcasts.map(bc => (
              <div key={bc.id} className={`rounded-2xl border p-5 ${bc.type === 'lockdown' ? 'border-purple-300 bg-purple-50' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    bc.type === 'lockdown'    ? 'bg-purple-100' :
                    bc.type === 'hemorrhagic' ? 'bg-red-100' :
                    bc.type === 'enteric'     ? 'bg-amber-100' :
                    bc.type === 'respiratory' ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {bc.type === 'lockdown' ? '🔒' : bc.type === 'hemorrhagic' ? '🩸' : bc.type === 'enteric' ? '🤢' : bc.type === 'respiratory' ? '🫁' : '📢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        bc.type === 'lockdown' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        bc.active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {bc.type === 'lockdown' ? '🔒 LOCKDOWN' : bc.active ? '📢 Active' : 'Removed'}
                      </span>
                      <span className="text-xs text-slate-400">{rel(bc.created_at)}</span>
                    </div>
                    <p className={`text-sm font-bold ${bc.type === 'lockdown' ? 'text-purple-900' : 'text-slate-900'}`}>{bc.title}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{bc.message}</p>
                    <p className="text-xs text-slate-400 mt-1">By {bc.issued_by} · {bc.zone}</p>
                  </div>
                </div>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 px-5 py-12 text-center text-sm text-slate-400">
                No broadcasts yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────── MAP TAB ──────────── */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Live Surveillance Map</h2>
            <button onClick={() => setShowBc(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all">
              🔒 Issue Lockdown
            </button>
          </div>
          <PHOLiveMap height={520} alertsOnly={false} />
          {/* Snapshot stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-red-700">{alerts.filter(a => a.status === 'confirmed').length}</p>
              <p className="text-xs text-red-600 mt-0.5 font-semibold">Confirmed</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-blue-700">{alerts.filter(a => a.status === 'investigating').length}</p>
              <p className="text-xs text-blue-600 mt-0.5 font-semibold">Investigating</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-amber-700">{alerts.filter(a => a.status === 'pending_investigation').length}</p>
              <p className="text-xs text-amber-600 mt-0.5 font-semibold">Pending</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
