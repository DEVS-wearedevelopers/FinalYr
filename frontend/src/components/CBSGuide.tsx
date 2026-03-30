'use client';
/**
 * CBSGuide — floating tab that opens a slide-in panel explaining
 * how to read CBS (Community Burden Score) values.
 *
 * Added to DashboardLayout so it's available on every dashboard.
 * Tap the "CBS" tab on the right edge → panel slides in from the right.
 */
import React, { useState } from 'react';

const BANDS = [
  {
    range: '0.85 – 1.00',
    label: 'Probable Outbreak',
    color: 'bg-red-600',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-600',
    icon: '🚨',
    description: 'CBS at or above the auto-escalation threshold. Alert is automatically raised to PHO for immediate investigation. Field team deployment recommended.',
    action: 'Auto-escalated to PHO · Likely outbreak response',
  },
  {
    range: '0.60 – 0.84',
    label: 'High Risk',
    color: 'bg-orange-500',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    icon: '⚠️',
    description: 'Elevated disease burden detected. PHO review is actively required. Multiple high-severity symptoms corroborated across several reports.',
    action: 'PHO investigation required',
  },
  {
    range: '0.45 – 0.59',
    label: 'Moderate Risk',
    color: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: '🟡',
    description: 'Moderate symptom cluster detected. Alert is raised and sits in the PHO queue for triage. Does not warrant immediate escalation but warrants monitoring.',
    action: 'Alert raised · Awaiting PHO triage',
  },
  {
    range: '0.20 – 0.44',
    label: 'Low Risk',
    color: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
    icon: '🟢',
    description: 'Low community burden — limited symptom variety, low patient count, or mild severity. Standard surveillance cadence applies.',
    action: 'Routine monitoring · No alert',
  },
  {
    range: '0.00 – 0.19',
    label: 'Negligible',
    color: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: '⬜',
    description: 'Near-zero signal. Report logged but no further action triggered. May indicate a false positive, very mild case, or data entry with minimal symptoms.',
    action: 'Logged only · No action',
  },
];

const FORMULA_STEPS = [
  { label: 'Severity weight',  formula: 'severity / 10 × 0.65',  note: 'Accounts for 65% of the score' },
  { label: 'Random variance',  formula: '+ rand(0 – 0.30)',       note: 'Simulates real-world symptom clustering noise' },
  { label: 'Cap',              formula: 'min(result, 0.99)',       note: 'Score never reaches 1.00 to avoid false certainty' },
];

export default function CBSGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating tab ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 bg-[#1e52f1] text-white px-1.5 py-3 rounded-l-xl shadow-lg hover:bg-[#1640cc] active:scale-95 transition-all select-none"
        title="CBS Score Guide"
        aria-label="Open CBS score guide"
      >
        <span className="text-[10px] font-black tracking-widest uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
          CBS
        </span>
        <svg className="w-3.5 h-3.5 opacity-70 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in panel ── */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#1e52f1] to-[#2d6ef5] text-white flex-shrink-0">
          <div>
            <h2 className="text-base font-black tracking-tight">CBS Score Guide</h2>
            <p className="text-xs text-white/70 mt-0.5">Community Burden Score — how to read it</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* What is CBS */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-4">
            <p className="text-xs font-black text-blue-800 uppercase tracking-wide mb-1.5">What is CBS?</p>
            <p className="text-sm text-blue-900 leading-relaxed">
              The <strong>Community Burden Score</strong> (CBS) is a composite 0–1 risk index computed by the AI engine for every submitted report. It combines symptom severity, patient count, and syndromic pattern to estimate the likelihood of a significant disease event in the reporting zone.
            </p>
          </div>

          {/* Score bands */}
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3 px-1">Score Interpretation</p>
            <div className="space-y-2.5">
              {BANDS.map(b => (
                <div key={b.range} className={`rounded-2xl border ${b.border} ${b.bg} p-4`}>
                  <div className="flex items-start gap-3">
                    {/* Colour dot */}
                    <div className={`w-3 h-3 rounded-full ${b.dot} mt-1 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                        <span className={`text-sm font-black ${b.text}`}>{b.label}</span>
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${b.bg} border ${b.border} ${b.text}`}>
                          {b.range}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
                      <p className={`text-[10px] font-bold mt-2 ${b.text} opacity-80`}>→ {b.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual scale */}
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3 px-1">Visual Scale</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-4 w-full rounded-full overflow-hidden flex mb-2">
                <div className="flex-[19] bg-slate-300" title="0.00–0.19" />
                <div className="flex-[25] bg-green-400" title="0.20–0.44" />
                <div className="flex-[15] bg-amber-400" title="0.45–0.59" />
                <div className="flex-[25] bg-orange-500" title="0.60–0.84" />
                <div className="flex-[16] bg-red-600" title="0.85–1.00" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>0.00</span>
                <span>0.20</span>
                <span>0.45</span>
                <span>0.60</span>
                <span>0.85</span>
                <span>1.00</span>
              </div>
              <div className="flex gap-3 flex-wrap mt-3">
                {[
                  { dot: 'bg-slate-300',  label: 'Negligible' },
                  { dot: 'bg-green-400',  label: 'Low' },
                  { dot: 'bg-amber-400',  label: 'Moderate' },
                  { dot: 'bg-orange-500', label: 'High' },
                  { dot: 'bg-red-600',    label: 'Probable' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                    <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* How it's calculated */}
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3 px-1">How It's Calculated</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
              {FORMULA_STEPS.map((s, i) => (
                <div key={s.label} className={`px-4 py-3 flex items-start gap-3 ${i < FORMULA_STEPS.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-[#1e52f1]/10 text-[#1e52f1] text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">{s.label}</p>
                    <code className="text-[11px] font-mono text-[#1e52f1] bg-[#1e52f1]/5 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      {s.formula}
                    </code>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 px-1">
              Note: The random variance term simulates the diagnostic uncertainty present in real-world syndromic surveillance.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
