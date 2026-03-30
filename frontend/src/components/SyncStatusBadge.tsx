'use client';
import React, { useEffect, useState } from 'react';
import { initSyncChannel, onStatusChange, getLastSyncAt, type SyncStatus } from '@/services/syncManager';

// Build fingerprint — if this changes on the phone, the new Vercel build is live
const BUILD_TS = '2026-03-30T07:59';

export default function SyncStatusBadge() {
  const [status, setStatus]    = useState<SyncStatus>('connecting');
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => {
    initSyncChannel();

    // Debug: log what Supabase URL is being used
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '(using hardcoded fallback)';
    console.log(`[SyncBadge] build=${BUILD_TS} supabaseUrl=${url} status=init`);

    const unsubStatus = onStatusChange((s) => {
      console.log(`[SyncBadge] status changed → ${s}`);
      setStatus(s);
    });

    const tick = setInterval(() => {
      const t = getLastSyncAt();
      setLastSync(t ? Math.floor((Date.now() - t) / 1000) : -1);
    }, 1000);

    const onRemote = () => setLastSync(0);
    window.addEventListener('domrs:remote-update', onRemote);

    return () => { unsubStatus(); clearInterval(tick); window.removeEventListener('domrs:remote-update', onRemote); };
  }, []);

  const cfg = {
    connected:  { dot: 'bg-green-500',  ring: 'border-green-200 bg-green-50',  text: 'text-green-700',  label: 'Live Sync',    pulse: true  },
    connecting: { dot: 'bg-amber-400',  ring: 'border-amber-200 bg-amber-50',  text: 'text-amber-700',  label: 'Connecting…',  pulse: true  },
    error:      { dot: 'bg-red-500',    ring: 'border-red-200 bg-red-50',      text: 'text-red-700',    label: 'Sync Error',   pulse: false },
    disabled:   { dot: 'bg-slate-400',  ring: 'border-slate-200 bg-slate-50',  text: 'text-slate-500',  label: 'Local only',   pulse: false },
  }[status];

  const syncLabel = status === 'connected' && lastSync >= 0
    ? lastSync === 0 ? '← just now' : lastSync < 60 ? `← ${lastSync}s ago` : ''
    : '';

  const supabaseUrlShort = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'fallback-rcuyvftc').slice(-8);

  return (
    <div
      title={`Sync: ${status} | build: ${BUILD_TS} | sb: …${supabaseUrlShort}`}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.ring} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.label}
      {syncLabel && <span className="opacity-60 font-normal">{syncLabel}</span>}
    </div>
  );
}
