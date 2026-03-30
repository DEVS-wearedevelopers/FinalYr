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
import { syncLog } from '@/services/syncLogger';

export type SyncStatus = 'connecting' | 'connected' | 'error' | 'disabled';

const CHANNEL_NAME = 'domrs-live-sync';
const EVENT_NAME   = 'state-update';
const MAX_RETRIES  = 3;   // after this many CHANNEL_ERRORs, stop retrying Supabase

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
  buildTs: '2026-03-30T08:33',
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
      syncLog.success('SUPABASE-RT', 'Broadcast received from remote peer',
        `reports=${(payload as any).reports?.length ?? '?'} alerts=${(payload as any).alerts?.length ?? '?'}`);
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
        syncLog.success('SUPABASE-RT', `Channel subscribed: ${CHANNEL_NAME}`);
        setStatus('connected');

      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        _retryCount++;
        _lastError = `${status} (attempt ${_retryCount})`;

        if (_retryCount >= MAX_RETRIES) {
          // Give up — Supabase is unavailable (project paused or no network).
          // WS + HTTP relays are handling sync; this is not a critical failure.
          syncLog.warn('SUPABASE-RT',
            `Channel unavailable after ${MAX_RETRIES} attempts — Supabase disabled`,
            'WS-RELAY and HTTP-RELAY are still active. Cross-device sync is unaffected.');
          _intentionalClose = true;
          if (_channel) { supabase.removeChannel(_channel); _channel = null; }
          setStatus('disabled');
          return;
        }

        syncLog.warn('SUPABASE-RT', `Channel ${status} (attempt ${_retryCount}/${MAX_RETRIES}) — retrying`);
        setStatus('error');

        // Mark as intentional so the CLOSED callback doesn't overwrite to 'disabled'
        _intentionalClose = true;
        if (_channel) { supabase.removeChannel(_channel); _channel = null; }

        const delay = Math.min(3000 * _retryCount, 15000);
        console.log(`[SyncManager] retry in ${delay}ms`);
        setTimeout(() => { initSyncChannel(); }, delay);

      } else if (status === 'CLOSED') {
        syncLog.warn('SUPABASE-RT', 'Channel closed', CHANNEL_NAME);
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
  syncLog.debug('SUPABASE-RT', 'Broadcast sent to channel', CHANNEL_NAME);
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
