'use client';
/**
 * syncManager.ts — Singleton Supabase Realtime channel manager.
 *
 * THE FIX: Previously, emitUpdate() called supabase.channel().send() on a
 * brand-new, unsubscribed channel every time. Supabase requires the channel
 * to be in SUBSCRIBED state before .send() works. This module maintains ONE
 * persistent, subscribed channel singleton for the lifetime of the page.
 *
 * Responsibilities:
 *   - Own the single 'domrs-live-sync' channel instance
 *   - Subscribe once and keep it alive
 *   - Expose broadcastState() for sending
 *   - Expose onStateReceived() for receiving
 *   - Track + expose connection status for UI indicators
 */

import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SyncStatus = 'connecting' | 'connected' | 'error' | 'disabled';

const CHANNEL_NAME = 'domrs-live-sync';
const EVENT_NAME   = 'state-update';

// ── Singleton state ───────────────────────────────────────────────────────────
let _channel:    RealtimeChannel | null = null;
let _status:     SyncStatus = 'connecting';
let _lastSyncAt: number = 0;
const _listeners: Array<(payload: Record<string, unknown>) => void> = [];
const _statusListeners: Array<(s: SyncStatus) => void> = [];

function setStatus(s: SyncStatus) {
  _status  = s;
  _statusListeners.forEach(fn => fn(s));
  // Emit a DOM event so non-React code can react too
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('domrs:sync-status', { detail: s }));
  }
}

// ── Init — called once ────────────────────────────────────────────────────────
export function initSyncChannel() {
  if (typeof window === 'undefined') return;  // SSR guard
  if (_channel) return;                        // already initialised

  _channel = supabase.channel(CHANNEL_NAME, {
    config: { broadcast: { self: false } },   // don't receive own messages
  });

  _channel
    .on('broadcast', { event: EVENT_NAME }, ({ payload }) => {
      if (!payload) return;
      _lastSyncAt = Date.now();
      _listeners.forEach(fn => fn(payload as Record<string, unknown>));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('domrs:remote-update', { detail: payload })
        );
      }
    })
    .subscribe((status) => {
      console.log('[SyncManager] Supabase channel status:', status);
      if (status === 'SUBSCRIBED')                setStatus('connected');
      else if (status === 'CHANNEL_ERROR')        setStatus('error');
      else if (status === 'TIMED_OUT')            setStatus('error');
      else if (status === 'CLOSED')               setStatus('disabled');
      else                                        setStatus('connecting');
    });
}

// ── Send ─────────────────────────────────────────────────────────────────────
export function broadcastState(payload: Record<string, unknown>) {
  if (!_channel || _status !== 'connected') return;
  _channel.send({ type: 'broadcast', event: EVENT_NAME, payload });
}

// ── Subscribe to incoming updates ─────────────────────────────────────────────
export function onStateReceived(
  fn: (payload: Record<string, unknown>) => void
): () => void {
  _listeners.push(fn);
  return () => {
    const i = _listeners.indexOf(fn);
    if (i !== -1) _listeners.splice(i, 1);
  };
}

// ── Subscribe to status changes ───────────────────────────────────────────────
export function onStatusChange(fn: (s: SyncStatus) => void): () => void {
  _statusListeners.push(fn);
  fn(_status); // emit current status immediately
  return () => {
    const i = _statusListeners.indexOf(fn);
    if (i !== -1) _statusListeners.splice(i, 1);
  };
}

export const getSyncStatus  = () => _status;
export const getLastSyncAt  = () => _lastSyncAt;
