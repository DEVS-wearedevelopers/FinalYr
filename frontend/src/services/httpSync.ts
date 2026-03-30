'use client';
/**
 * httpSync.ts — Cross-device sync via render.com backend HTTP relay.
 *
 * WHY THIS EXISTS:
 *   Supabase Realtime requires NEXT_PUBLIC_SUPABASE_URL on Vercel.
 *   NEXT_PUBLIC_API_URL is ALREADY on Vercel (points to render.com).
 *   So we relay state through the render.com /sync/state endpoint instead.
 *
 * HOW IT WORKS:
 *   - On every emitUpdate(): POST the full MOCK_STATE to render.com
 *   - Every 1.5s: GET from render.com; if state is newer, merge + re-render
 *   - Also registers device presence on every poll for EOC Live Devices
 *
 * BONUS: 1.5s polling keeps render.com awake (prevents cold-start during demo)
 */

import { MOCK_STATE } from '@/services/mockData';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
  .replace(/\/$/, '');

// ── Stable device ID (survives re-renders, resets on tab close) ──────────────
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('domrs-device-id');
  if (!id) {
    id = `dev-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('domrs-device-id', id);
  }
  return id;
}

// ── Live device tracking ──────────────────────────────────────────────────────
export type LiveDevice = {
  id:       string;
  role:     string;
  user:     string;
  device:   'mobile' | 'desktop';
  lastSeen: number;
};

type DeviceListener = (devices: LiveDevice[]) => void;
const _deviceListeners: DeviceListener[] = [];

export function onLiveDevicesChange(fn: DeviceListener): () => void {
  _deviceListeners.push(fn);
  return () => { const i = _deviceListeners.indexOf(fn); if (i !== -1) _deviceListeners.splice(i, 1); };
}

// ── Timestamp tracking ────────────────────────────────────────────────────────
let _lastAppliedTs = 0;

// ── Push state to backend (called from emitUpdate) ────────────────────────────
export function pushStateToBackend(role = 'unknown', user = 'User'): void {
  if (typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  const ts = Date.now();
  // Don't await — fire and forget
  fetch(`${API}/sync/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ts, deviceId, role, user,
      state: {
        reports:    MOCK_STATE.reports,
        alerts:     MOCK_STATE.alerts,
        broadcasts: MOCK_STATE.broadcasts,
        auditLogs:  MOCK_STATE.auditLogs,
      },
    }),
  })
    .then(r => r.json())
    .then((data: { devices?: LiveDevice[] }) => {
      if (data.devices) _deviceListeners.forEach(fn => fn(data.devices!));
    })
    .catch(() => { /* backend offline — silent */ });
}

// ── Poll backend for updates + announce presence ──────────────────────────────
export async function pollBackend(
  role: string,
  user: string,
  onUpdate: () => void,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  try {
    const res = await fetch(
      `${API}/sync/state` +
      `?d=${encodeURIComponent(deviceId)}` +
      `&r=${encodeURIComponent(role)}` +
      `&u=${encodeURIComponent(user)}`
    );
    if (!res.ok) return;
    const data = await res.json() as { state: Record<string, unknown> | null; ts: number; devices: LiveDevice[] };

    // Update live device list
    if (data.devices) _deviceListeners.forEach(fn => fn(data.devices));

    // Apply state only if it's newer than what we currently have
    if (data.ts > _lastAppliedTs && data.state) {
      _lastAppliedTs = data.ts;
      const s = data.state;
      if (Array.isArray(s.reports))    MOCK_STATE.reports    = s.reports    as typeof MOCK_STATE.reports;
      if (Array.isArray(s.alerts))     MOCK_STATE.alerts     = s.alerts     as typeof MOCK_STATE.alerts;
      if (Array.isArray(s.broadcasts)) MOCK_STATE.broadcasts = s.broadcasts as typeof MOCK_STATE.broadcasts;
      if (Array.isArray(s.auditLogs))  MOCK_STATE.auditLogs  = s.auditLogs  as typeof MOCK_STATE.auditLogs;
      window.dispatchEvent(new CustomEvent('domrs:update', { detail: { type: 'http-poll' } }));
      onUpdate();
    }
  } catch { /* backend not reachable — skip */ }
}
