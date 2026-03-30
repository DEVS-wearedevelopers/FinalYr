'use client';
import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import AiAnalysisPanel from '@/components/AiAnalysisPanel';
import {
  mockGetReports, mockSubmitReport, mockGetAnalytics, mockGetBroadcasts,
  INSTITUTION_COORDS,
  type Report, type Broadcast,
} from '@/services/mockData';
import { useMockSync } from '@/hooks/useMockSync';
import { useWsSync } from '@/hooks/useWsSync';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import type { CivilianMapHandle } from '@/screens/Civilian/CivilianMap';

// Load map with no SSR — shares same map component as civilian view
const LiveMapWithRef = dynamic(() => import('@/screens/Civilian/CivilianMap'), { ssr: false });

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  {
    label: 'Overview', href: '/dashboard/institution',
    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Reports', href: '/dashboard/institution/reports',
    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    label: 'Inbox', href: '/dashboard/institution/inbox',
    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
  },
];

const ORG_ID = 'usr-institution-001';
const FACILITY_NAME = 'Lagos General Hospital, Lagos Island';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rel(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

function PipelineBadge({ status }: { status: string }) {
  const s = status.toLowerCase().replace(/ /g, '_');
  if (s === 'pending_ai')  return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">Pending AI</span>;
  if (s === 'ai_scored')   return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">AI Scored</span>;
  if (s.includes('pho'))   return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">PHO Review</span>;
  if (s === 'validated')   return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">Validated</span>;
  if (s === 'dismissed')   return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-50 text-slate-400 border border-slate-100">Dismissed</span>;
  return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">{status}</span>;
}

// ─── Sentinel Report Modal ────────────────────────────────────────────────────
const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Difficulty breathing', 'Vomiting', 'Diarrhoea',
  'Rash', 'Bleeding', 'Headache', 'Body aches', 'Fatigue', 'Chest pain', 'Loss of taste/smell',
];

function SentinelModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (report: Report) => void;
}) {
  const [step, setStep]           = useState(1);
  const [symptoms, setSymptoms]   = useState<string[]>([]);
  const [patientCount, setCount]  = useState('');
  const [severity, setSeverity]   = useState(5);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = (s: string) => setSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const submit = async () => {
    if (!patientCount || symptoms.length === 0) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const coords = INSTITUTION_COORDS[ORG_ID];
    const report = mockSubmitReport({
      source: 'sentinel',
      organization_id: ORG_ID,
      patient_count: parseInt(patientCount),
      symptom_matrix: symptoms,
      severity,
      origin_address: FACILITY_NAME,
      origin_lat: coords.lat,
      origin_lng: coords.lng,
      notes,
    });
    onSuccess(report);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">New Sentinel Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step}/2 — {step === 1 ? 'Symptom selection' : 'Patient details'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Symptoms observed <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SYMPTOM_OPTIONS.map(s => (
                    <button key={s} onClick={() => toggle(s)}
                      className={`text-left text-xs font-medium px-3 py-2.5 rounded-xl border transition-all ${symptoms.includes(s) ? 'bg-[#1e52f1] text-white border-[#1e52f1]' : 'bg-white text-slate-700 border-slate-200 hover:border-[#1e52f1]/40'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {symptoms.length > 0 && (
                  <p className="text-xs text-[#1e52f1] mt-2 font-semibold">Selected: {symptoms.join(', ')}</p>
                )}
              </div>
              <button onClick={() => setStep(2)} disabled={symptoms.length === 0}
                className="w-full py-3 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] disabled:opacity-40 transition-all">
                Next: Patient Details →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Facility location indicator */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-xs font-bold text-blue-800">Reporting from</p>
                  <p className="text-xs text-blue-700">{FACILITY_NAME}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Patients affected <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={patientCount} onChange={e => setCount(e.target.value)} placeholder="e.g. 12"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Severity: <span className={`font-black ${severity >= 8 ? 'text-red-600' : severity >= 5 ? 'text-amber-600' : 'text-green-600'}`}>{severity}/10</span>
                </label>
                <input type="range" min={1} max={10} value={severity} onChange={e => setSeverity(Number(e.target.value))} className="w-full accent-[#1e52f1]" />
                <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Mild</span><span>Critical</span></div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinical notes (optional)</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Ward, onset timing, additional context..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wide mb-2">Report Summary</p>
                <p className="text-slate-700"><strong>Symptoms:</strong> {symptoms.join(', ')}</p>
                <p className="text-slate-700"><strong>Patients:</strong> {patientCount || '—'}</p>
                <p className="text-slate-700"><strong>Severity:</strong> {severity}/10</p>
                <p className="text-slate-700"><strong>Location:</strong> {FACILITY_NAME}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                <button onClick={submit} disabled={submitting || !patientCount || symptoms.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</> : '📤 Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function InstitutionDashboard() {
  const tokenUser = useUserFromToken();
  const mapRef = useRef<CivilianMapHandle>(null);

  const [showModal, setShowModal]   = useState(false);
  const [reports, setReports]       = useState<Report[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [analytics, setAnalytics]   = useState<ReturnType<typeof mockGetAnalytics> | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [toast, setToast]           = useState('');
  const [mapOpen, setMapOpen]       = useState(false);

  const load = () => {
    setReports(mockGetReports(ORG_ID));
    setAnalytics(mockGetAnalytics(ORG_ID));
    setBroadcasts(mockGetBroadcasts().filter(b => b.active));
  };

  useMockSync(load);       // same-tab + cross-tab (same browser)
  useWsSync(load);         // same-network local demo fallback
  useSupabaseSync(load);   // ✅ cross-device: phone ↔ PC via Vercel

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 4000); };

  const todayCount = reports.filter(r =>
    new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;

  const activeLockdown = broadcasts.find(b => b.type === 'lockdown');

  return (
    <DashboardLayout navItems={NAV} role="institution" userName={tokenUser?.name || 'Institution'}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-sm">
          {toast}
        </div>
      )}
      {showModal && (
        <SentinelModal
          onClose={() => setShowModal(false)}
          onSuccess={report => {
            setShowModal(false);
            load();
            // Push live pin onto the map
            mapRef.current?.addPin(report);
            showToast(`✅ Report submitted — CBS: ${report.cbs_score?.toFixed(2)} · Pin added to map`);
          }}
        />
      )}

      {/* ── LOCKDOWN Banner ── */}
      {activeLockdown && (
        <div className="-mx-8 -mt-8 px-8 py-5 mb-6 bg-purple-700 border-b border-purple-600 flex items-start gap-4">
          <span className="text-3xl shrink-0 animate-pulse">🔒</span>
          <div className="flex-1">
            <p className="text-white font-black text-base">ZONE LOCKDOWN ACTIVE</p>
            <p className="text-purple-100 text-sm mt-1 leading-relaxed">{activeLockdown.message}</p>
            <p className="text-purple-300 text-xs mt-1">From {activeLockdown.issued_by}</p>
          </div>
        </div>
      )}

      {/* ── Broadcast Banner ── */}
      {!activeLockdown && broadcasts.length > 0 && (
        <div className={`-mx-8 -mt-8 px-8 py-4 mb-6 border-b ${
          broadcasts[0].type === 'hemorrhagic' ? 'bg-red-600' :
          broadcasts[0].type === 'enteric'     ? 'bg-amber-500' : 'bg-blue-600'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-white text-xl shrink-0">
              {broadcasts[0].type === 'hemorrhagic' ? '🚨' : broadcasts[0].type === 'enteric' ? '⚠️' : '📢'}
            </span>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{broadcasts[0].title}</p>
              <p className="text-white/80 text-xs mt-0.5 leading-relaxed">{broadcasts[0].message}</p>
            </div>
            {broadcasts.length > 1 && <span className="text-white/70 text-xs shrink-0">+{broadcasts.length-1} more</span>}
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500" />
            <span className="text-sm font-bold text-green-700">Offline Demo</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-sm text-slate-600"><span className="font-bold text-slate-900">{todayCount}</span> report{todayCount !== 1 ? 's' : ''} today</span>
        </div>
        {broadcasts.length > 0 && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border border-${activeLockdown ? 'purple' : 'amber'}-200 bg-${activeLockdown ? 'purple' : 'amber'}-50 text-${activeLockdown ? 'purple' : 'amber'}-800`}>
            {activeLockdown ? '🔒 Lockdown Active' : `📢 ${broadcasts.length} advisory`}
          </span>
        )}
      </div>

      {/* ── CTA ── */}
      <button onClick={() => setShowModal(true)}
        className="w-full mb-6 flex items-center justify-center gap-3 py-5 px-8 rounded-2xl bg-gradient-to-r from-[#1e52f1] to-[#2d6ef5] text-white font-bold text-base shadow-lg shadow-[#1e52f1]/25 hover:shadow-xl hover:scale-[1.004] active:scale-[0.998] transition-all">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
        + New Sentinel Report
        <span className="ml-auto text-xs bg-white/15 px-3 py-1 rounded-full border border-white/20">AI-scored · pins to map</span>
      </button>

      {/* ── Live Map (collapsible) ── */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setMapOpen(m => !m)}
          className="w-full flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-800 flex-1">Facility Report Map</h2>
          <span className="text-xs text-slate-400">{mapOpen ? 'Hide map' : 'Show map'}</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${mapOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {mapOpen && <LiveMapWithRef ref={mapRef} height={280} showLegend={true} />}
      </div>

      {/* ── AI Analysis ── */}
      <div className="mb-6">
        <AiAnalysisPanel compact />
      </div>

      {/* ── Facility Health ── */}
      {analytics && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 mb-6">
          <h2 className="text-sm font-bold text-slate-800">Facility Health Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-2xl border p-4 ${analytics.dataQualityScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wide">Data Quality</p>
              <p className={`text-3xl font-black mt-1 ${analytics.dataQualityScore >= 70 ? 'text-green-700' : 'text-red-700'}`}>{analytics.dataQualityScore}%</p>
              <p className="text-xs mt-1 opacity-70">{analytics.dataQualityScore >= 70 ? 'Above threshold' : 'Below 70%'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports This Month</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{analytics.reportsThisMonth}</p>
              <p className="text-xs text-slate-500 mt-1">vs {analytics.reportsLastMonth} last month</p>
            </div>
            <div className={`rounded-2xl border p-4 ${analytics.eocFlags.length ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wide">EOC Flags</p>
              <p className={`text-3xl font-black mt-1 ${analytics.eocFlags.length ? 'text-red-700' : 'text-green-700'}`}>{analytics.eocFlags.length}</p>
              <p className="text-xs mt-1 opacity-70">{analytics.eocFlags.length ? analytics.eocFlags[0] : 'No active flags'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Active PHO Broadcasts ── */}
      {broadcasts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-800">Active PHO Broadcasts</h2>
            <span className="ml-auto text-xs text-slate-400">{broadcasts.length} active</span>
          </div>
          <div className="divide-y divide-slate-50">
            {broadcasts.map(bc => (
              <div key={bc.id} className={`px-5 py-4 flex items-start gap-3 ${bc.type === 'lockdown' ? 'bg-purple-50' : ''}`}>
                <span className="text-lg shrink-0">
                  {bc.type === 'lockdown' ? '🔒' : bc.type === 'hemorrhagic' ? '🩸' : bc.type === 'enteric' ? '🤢' : bc.type === 'respiratory' ? '🫁' : '📢'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${bc.type === 'lockdown' ? 'text-purple-900' : 'text-slate-900'}`}>{bc.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{bc.message}</p>
                  <p className="text-xs text-slate-400 mt-1">From {bc.issued_by}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Report Feed ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-800">Report Feed</h2>
          <span className="ml-auto text-xs text-slate-400">{reports.length} reports</span>
        </div>
        <div className="divide-y divide-slate-50">
          {reports.map(row => (
            <React.Fragment key={row.id}>
              <div onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer">
                <div className="w-14 shrink-0"><p className="text-xs font-semibold text-slate-700">{rel(row.created_at)}</p></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-700 truncate">{row.symptom_matrix.join(' · ')}</p></div>
                {row.cbs_score !== undefined && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    row.cbs_score >= 0.8 ? 'bg-red-50 text-red-700' :
                    row.cbs_score >= 0.5 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}>CBS {row.cbs_score.toFixed(2)}</span>
                )}
                <div className="shrink-0"><PipelineBadge status={row.status} /></div>
                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded === row.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
              {expanded === row.id && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Patients</p><p className="font-bold text-slate-900 text-lg">{row.patient_count}</p></div>
                    <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">Severity</p><p className="font-bold text-slate-900 text-lg">{row.severity}/10</p></div>
                    <div className="bg-white rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400">CBS Score</p><p className="font-bold text-slate-900">{row.cbs_score?.toFixed(2) ?? '—'}</p></div>
                  </div>
                  <div><p className="text-xs text-slate-400 mb-1.5">Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {row.symptom_matrix.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{s}</span>)}
                    </div>
                  </div>
                  {row.notes && <p className="text-xs text-slate-500 italic">&ldquo;{row.notes}&rdquo;</p>}
                </div>
              )}
            </React.Fragment>
          ))}
          {reports.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No reports yet. Submit your first sentinel report above.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
