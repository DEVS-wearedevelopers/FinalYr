'use client';
import React, { useState, useEffect } from 'react';
import { mockGetLatestAnalysis, generateAiAnalysis, type AiAnalysis } from '@/services/mockData';

const RISK_CONFIG = {
  low:      { color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200', bar: 'bg-green-500',  pct: 15,  label: 'Low Risk',      dot: 'bg-green-500'  },
  moderate: { color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200', bar: 'bg-amber-500',  pct: 45,  label: 'Moderate Risk', dot: 'bg-amber-500'  },
  high:     { color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200',bar: 'bg-orange-500', pct: 72,  label: 'High Risk',     dot: 'bg-orange-500' },
  critical: { color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',   bar: 'bg-red-600',    pct: 95,  label: 'CRITICAL',      dot: 'bg-red-600'    },
};

const TREND_ICON  = { rising: '📈', stable: '➡️', declining: '📉' };
const TREND_COLOR = { rising: 'text-red-600', stable: 'text-amber-600', declining: 'text-green-600' };

interface Props {
  compact?: boolean;
  onBroadcast?: () => void;
}

export default function AiAnalysisPanel({ compact = false, onBroadcast }: Props) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(true);
  // Client-only timestamp to avoid hydration mismatch
  const [genTime, setGenTime]   = useState('');

  useEffect(() => {
    // Initialize on client only — avoids SSR/client mismatch
    const a = mockGetLatestAnalysis();
    setAnalysis(a);
    if (a) setGenTime(new Date(a.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const refresh = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const result = generateAiAnalysis();
    setAnalysis(result);
    setGenTime(new Date(result.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  };

  if (!analysis) return null;

  const cfg = RISK_CONFIG[analysis.risk_level];

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1e52f1] flex items-center justify-center text-white text-sm shrink-0">
            🤖
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">AI Surveillance Analysis</p>
            {genTime && (
              <p className="text-xs text-slate-500 mt-0.5">Generated {genTime}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#1e52f1]/30 text-[#1e52f1] bg-white hover:bg-[#1e52f1] hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <><div className="w-3 h-3 border-2 border-[#1e52f1]/30 border-t-[#1e52f1] rounded-full animate-spin"/>Analysing…</>
            ) : (
              <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Re-analyse</>
            )}
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-black/5">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 space-y-4">
          {/* Risk gauge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${analysis.risk_level === 'critical' ? 'animate-pulse' : ''}`}/>
                <span className={`text-sm font-black ${cfg.color}`}>{cfg.label}</span>
              </div>
              <span className={`text-sm font-bold ${TREND_COLOR[analysis.trend]}`}>
                {TREND_ICON[analysis.trend]} {analysis.trend}
              </span>
            </div>
            <div className="h-2 bg-black/10 rounded-full overflow-hidden">
              <div className={`h-full ${cfg.bar} rounded-full transition-all duration-700`} style={{ width: `${cfg.pct}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-xl p-3 text-center border border-black/5">
              <p className="text-xl font-black text-slate-900">{analysis.total_patients}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Patients</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center border border-black/5">
              <p className="text-xl font-black text-[#1e52f1]">{analysis.sentinel_count}</p>
              <p className="text-xs text-slate-500 mt-0.5">Sentinel Reports</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center border border-black/5">
              <p className="text-xl font-black text-green-700">{analysis.community_count}</p>
              <p className="text-xs text-slate-500 mt-0.5">Community Reports</p>
            </div>
          </div>

          {/* Symptoms */}
          {analysis.dominant_symptoms.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dominant Symptom Cluster</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.dominant_symptoms.map((s, i) => (
                  <span key={s} className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    i === 0 ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-slate-700 border-slate-200'
                  }`}>
                    {i === 0 ? '⚠️ ' : ''}{s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Narrative */}
          <div className="bg-white/80 rounded-xl p-4 border border-black/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              📊 AI Narrative — Hotspot: <span className={cfg.color}>{analysis.hotspot}</span>
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Recommendation */}
          <div className={`rounded-xl p-4 border ${analysis.risk_level === 'critical' ? 'bg-red-600 border-red-600' : 'bg-white/80 border-black/5'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${analysis.risk_level === 'critical' ? 'text-white/80' : 'text-slate-500'}`}>
              💡 Recommended Action
            </p>
            <p className={`text-sm font-semibold leading-relaxed ${analysis.risk_level === 'critical' ? 'text-white' : cfg.color}`}>
              {analysis.recommendation}
            </p>
            {onBroadcast && (analysis.risk_level === 'critical' || analysis.risk_level === 'high') && (
              <button onClick={onBroadcast}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#1e52f1] text-xs font-bold hover:bg-blue-50 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                Issue Broadcast Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
