'use client';
/**
 * syncManager.ts — Singleton Supabase Realtime channel + diagnostics.
 *
 * RETRY BUG FIX: Previously, calling supabase.removeChannel() during a retry
 * would fire status='CLOSED' which overwrote the badge to 'Local only'.
 * Fixed with _intentionalClose flag — CLOSED is ignored during retries.
 */

import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SyncStatus = 'connecting' | 'connected' | 'error' | 'disabled';

const CHANNEL_NAME = 'domrs-live-sync';
const EVENT_NAME   = 'state-update';

// ── Singleton state ───────────────────────────────────────────────────────────
let _channel:         RealtimeChannel | null = null;
let _status:          SyncStatus = 'connecting';
let _rawStatus:       string = 'INIT';
let _retryCount:      number = 0;
let _lastError:       string = '';
let _lastSyncAt:      number = 0;
let _intentionalClose = false;

const _listeners:       Array<(p: Record<string, unknown>) => void> = [];
const _statusListeners: Array<(s: SyncStatus) => void> = [];

// ── Diagnostics (exposed for debug panel) ────────────────────────────────────
export const getDiagnostics = () => ({
  status:     _status,
  rawStatus:  _rawStatus,
  retryCount: _retryCount,
  lastError:  _lastError,
  lastSyncAt: _lastSyncAt,
  channel:    CHANNEL_NAME,
  supabaseUrl: (process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `env:${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(-12)}`
    : 'hardcoded-fallback'),
  buildTs: '2026-03-30T08:20',
});

function setStatus(s: SyncStatus) {
  _status = s;
  _statusListeners.forEach(fn => fn(s));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('domrs:sync-status', {
      detail: { status: s, raw: _rawStatus, retries: _retryCount, err: _lastError },
    }));
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
export function initSyncChannel() {
  if (typeof window === 'undefined') return;
  if (_channel) return;

  _intentionalClose = false;
  _channel = supabase.channel(CHANNEL_NAME, {
    config: { broadcast: { self: false } },
  });

  _channel
    .on('broadcast', { event: EVENT_NAME }, ({ payload }) => {
      if (!payload) return;
      _lastSyncAt = Date.now();
      _listeners.forEach(fn => fn(payload as Record<string, unknown>));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('domrs:remote-update', { detail: payload }));
      }
    })
    .subscribe((status, err) => {
      _rawStatus = status;
      if (err) _lastError = String(err);

      console.log(`[SyncManager] ${status} retries=${_retryCount}${err ? ' err=' + err : ''}`);

      if (status === 'SUBSCRIBED') {
        _lastError = '';
        setStatus('connected');

      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        _retryCount++;
        _lastError = `${status} (attempt ${_retryCount})`;
        setStatus('error');

        // Mark as intentional so the CLOSED callback doesn't overwrite to 'disabled'
        _intentionalClose = true;
        if (_channel) { supabase.removeChannel(_channel); _channel = null; }

        const delay = Math.min(3000 * _retryCount, 15000);
        console.log(`[SyncManager] retry in ${delay}ms`);
        setTimeout(() => { initSyncChannel(); }, delay);

      } else if (status === 'CLOSED') {
        if (_intentionalClose) {
          _intentionalClose = false; // we caused this — don't change status
        } else {
          setStatus('disabled'); // externally closed
        }
      } else {
        setStatus('connecting');
      }
    });
}

// ── Send ─────────────────────────────────────────────────────────────────────
export function broadcastState(payload: Record<string, unknown>) {
  if (!_channel || _status !== 'connected') return;
  _channel.send({ type: 'broadcast', event: EVENT_NAME, payload });
}

// ── Listeners ─────────────────────────────────────────────────────────────────
export function onStateReceived(fn: (p: Record<string, unknown>) => void): () => void {
  _listeners.push(fn);
  return () => { const i = _listeners.indexOf(fn); if (i !== -1) _listeners.splice(i, 1); };
}

export function onStatusChange(fn: (s: SyncStatus) => void): () => void {
  _statusListeners.push(fn);
  fn(_status);
  return () => { const i = _statusListeners.indexOf(fn); if (i !== -1) _statusListeners.splice(i, 1); };
}

export const getSyncStatus = () => _status;
export const getLastSyncAt = () => _lastSyncAt;
