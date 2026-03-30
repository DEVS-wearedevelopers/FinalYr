'use client';
/**
 * SyncStatusBadge — multi-transport sync indicator.
 *
 * Three transport pills: WS-RELAY | HTTP-RELAY | SUPABASE-RT
 * Status is derived from actual syncLogger events.
 *
 * IMPORTANT: Supabase 'disabled' (gave up after 3 retries on paused project)
 * is treated as NEUTRAL, not an error. WS + HTTP handle local sync.
 * The overall badge only shows red if BOTH WS and HTTP have errored.
 */
import React, { useEffect, useState } from 'react';
import {
  initSyncChannel, onStatusChange, getLastSyncAt, type SyncStatus,
} from '@/services/syncManager';
import { onSyncLogChange, getSyncLogs } from '@/services/syncLogger';

// Derive WS + HTTP status from sync log entries
function deriveTransportStatus(module: string): 'ok' | 'warn' | 'error' | 'idle' {
  const entries = getSyncLogs().filter(e => e.module === module).slice(0, 5);
  if (entries.length === 0) return 'idle';
  const latest = entries[0];
  if (latest.level === 'SUCCESS' || latest.level === 'INFO')   return 'ok';
  if (latest.level === 'WARN')   return 'warn';
  if (latest.level === 'ERROR')  return 'error';
  return 'idle';
}

function TransportPill({
  label, status, detail,
}: {
  label: string;
  status: 'ok' | 'warn' | 'error' | 'idle' | 'connecting' | 'disabled';
  detail?: string;
}) {
  const cfg = {
    ok:         { dot: 'bg-green-500',  ring: 'border-green-200 bg-green-50',   text: 'text-green-700',  pulse: true },
    warn:       { dot: 'bg-amber-400',  ring: 'border-amber-200 bg-amber-50',   text: 'text-amber-700',  pulse: false },
    error:      { dot: 'bg-red-500',    ring: 'border-red-200 bg-red-50',       text: 'text-red-700',    pulse: false },
    idle:       { dot: 'bg-slate-300',  ring: 'border-slate-200 bg-slate-50',   text: 'text-slate-400',  pulse: false },
    connecting: { dot: 'bg-amber-400',  ring: 'border-amber-200 bg-amber-50',   text: 'text-amber-700',  pulse: true  },
    disabled:   { dot: 'bg-slate-300',  ring: 'border-slate-200 bg-slate-50',   text: 'text-slate-400',  pulse: false },
  }[status];

  return (
    <span
      title={detail}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.ring} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}

export default function SyncStatusBadge({ compact = false }: { compact?: boolean }) {
  const [supaStatus, setSupaStatus] = useState<SyncStatus>('connecting');
  const [lastSync,   setLastSync]   = useState(0);
  const [wsStatus,   setWsStatus]   = useState<'ok'|'warn'|'error'|'idle'>('idle');
  const [httpStatus, setHttpStatus] = useState<'ok'|'warn'|'error'|'idle'>('idle');

  useEffect(() => {
    initSyncChannel();

    const unsubSupaStatus = onStatusChange(setSupaStatus);

    // Refresh transport pills whenever sync log changes
    const unsubLog = onSyncLogChange(() => {
      setWsStatus(deriveTransportStatus('WS-RELAY'));
      setHttpStatus(deriveTransportStatus('HTTP-RELAY'));
    });

    // Last-sync ticker
    const tick = setInterval(() => {
      const t = getLastSyncAt();
      setLastSync(t ? Math.floor((Date.now() - t) / 1000) : -1);
    }, 1000);

    const onRemote = () => setLastSync(0);
    window.addEventListener('domrs:remote-update', onRemote);

    return () => {
      unsubSupaStatus();
      unsubLog();
      clearInterval(tick);
      window.removeEventListener('domrs:remote-update', onRemote);
    };
  }, []);

  const supaStatusMapped = (
    supaStatus === 'connected'  ? 'ok' :
    supaStatus === 'connecting' ? 'connecting' :
    supaStatus === 'disabled'   ? 'disabled' :  // gave up — show neutral, not red
    supaStatus === 'error'      ? 'warn'     :  // still retrying — amber, not red
    'idle'
  ) as 'ok' | 'warn' | 'error' | 'idle' | 'connecting' | 'disabled';

  const syncLabel = supaStatus === 'connected' && lastSync >= 0
    ? lastSync === 0 ? '← just now' : lastSync < 60 ? `← ${lastSync}s ago` : ''
    : '';

  if (compact) {
    // Overall health: green if WS or HTTP is ok; only red if both WS+HTTP have errored.
    // Supabase being disabled (paused free tier) is NOT counted as a failure.
    const localSyncOk  = wsStatus === 'ok' || httpStatus === 'ok';
    const localSyncErr = wsStatus === 'error' && httpStatus === 'error';
    const statusLabel  = localSyncErr ? 'Sync Error' : localSyncOk ? 'Live Sync' : 'Connecting…';
    const dotCls       = localSyncErr ? 'bg-red-500' : localSyncOk ? 'bg-green-500' : 'bg-amber-400 animate-pulse';
    const ringCls      = localSyncErr
      ? 'border-red-200 bg-red-50 text-red-700'
      : localSyncOk
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

    return (
      <div
        title={`WS: ${wsStatus} | HTTP: ${httpStatus} | Supabase: ${supaStatus}`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${ringCls}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        {statusLabel}
        {syncLabel && <span className="opacity-60 font-normal">{syncLabel}</span>}
      </div>
    );
  }

  // Expanded: three pills side-by-side
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <TransportPill
        label="WS"
        status={wsStatus}
        detail="WebSocket relay — cross-device real-time sync"
      />
      <TransportPill
        label="HTTP"
        status={httpStatus}
        detail="HTTP polling relay — 1.5s interval cross-device sync"
      />
      <TransportPill
        label="Supabase"
        status={supaStatusMapped}
        detail={`Supabase Realtime broadcast channel — status: ${supaStatus}`}
      />
      {syncLabel && (
        <span className="text-[10px] text-slate-400 font-normal">{syncLabel}</span>
      )}
    </div>
  );
}
