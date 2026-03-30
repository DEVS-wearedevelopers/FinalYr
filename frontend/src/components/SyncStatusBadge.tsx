'use client';
import React, { useEffect, useState } from 'react';
import { initSyncChannel, onStatusChange, getLastSyncAt, getDiagnostics, type SyncStatus } from '@/services/syncManager';

export default function SyncStatusBadge() {
  const [status, setStatus]     = useState<SyncStatus>('connecting');
  const [expanded, setExpanded] = useState(false);
  const [diag, setDiag]         = useState(getDiagnostics());

  useEffect(() => {
    initSyncChannel();

    const unsubStatus = onStatusChange((s) => {
      setStatus(s);
      setDiag(getDiagnostics());
    });

    // Refresh diagnostics every second
    const tick = setInterval(() => setDiag(getDiagnostics()), 1000);

    // Listen for sync events to flash diagnostics
    const onSyncEvt = () => setDiag(getDiagnostics());
    window.addEventListener('domrs:sync-status',   onSyncEvt);
    window.addEventListener('domrs:remote-update', onSyncEvt);

    return () => {
      unsubStatus();
      clearInterval(tick);
      window.removeEventListener('domrs:sync-status',   onSyncEvt);
      window.removeEventListener('domrs:remote-update', onSyncEvt);
    };
  }, []);

  const cfg = {
    connected:  { dot: 'bg-green-500',  ring: 'border-green-200 bg-green-50',  text: 'text-green-700',  label: 'Live Sync',   pulse: true  },
    connecting: { dot: 'bg-amber-400',  ring: 'border-amber-200 bg-amber-50',  text: 'text-amber-700',  label: 'Connecting…', pulse: true  },
    error:      { dot: 'bg-red-500',    ring: 'border-red-200 bg-red-50',      text: 'text-red-700',    label: 'Retrying…',   pulse: true  },
    disabled:   { dot: 'bg-slate-400',  ring: 'border-slate-200 bg-slate-50',  text: 'text-slate-500',  label: 'Offline',     pulse: false },
  }[status];

  const secsAgo = diag.lastSyncAt ? Math.floor((Date.now() - diag.lastSyncAt) / 1000) : -1;

  return (
    <div className="relative">
      {/* ── Compact badge — click for debug panel ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${cfg.ring} ${cfg.text}`}
        title="Click for sync diagnostics"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
        {cfg.label}
        {status === 'connected' && secsAgo >= 0 && secsAgo < 60 && (
          <span className="opacity-60 font-normal">
            {secsAgo < 2 ? '← just now' : `← ${secsAgo}s ago`}
          </span>
        )}
        {diag.retryCount > 0 && status !== 'connected' && (
          <span className="opacity-60 font-normal">×{diag.retryCount}</span>
        )}
      </button>

      {/* ── Expanded debug panel ── */}
      {expanded && (
        <div className="absolute right-0 top-8 z-[500] w-72 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl p-4 text-xs font-mono border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-300 font-sans">Sync Diagnostics</span>
            <button onClick={() => setExpanded(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>

          <div className="space-y-1.5">
            <Row label="Status"    value={`${diag.status} (${diag.rawStatus})`}
              color={diag.status === 'connected' ? 'text-green-400' : diag.status === 'error' ? 'text-red-400' : 'text-amber-400'} />
            <Row label="Channel"   value={diag.channel} />
            <Row label="Retries"   value={String(diag.retryCount)}
              color={diag.retryCount > 2 ? 'text-red-400' : 'text-slate-300'} />
            <Row label="Last err"  value={diag.lastError || 'none'}
              color={diag.lastError ? 'text-red-400' : 'text-slate-500'} />
            <Row label="Last sync" value={secsAgo >= 0 ? `${secsAgo}s ago` : 'never'} />
            <Row label="Supabase"  value={diag.supabaseUrl} />
            <Row label="Build"     value={diag.buildTs} />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700 text-slate-400 font-sans">
            {diag.status === 'connected'
              ? '✅ Real-time sync active. Reports on other devices will sync within 100ms.'
              : diag.retryCount > 3
              ? `⚠️ ${diag.retryCount} retries. Error: ${diag.lastError}`
              : '⏳ Connecting to Supabase Realtime…'}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color = 'text-slate-300' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`${color} truncate text-right`}>{value}</span>
    </div>
  );
}
