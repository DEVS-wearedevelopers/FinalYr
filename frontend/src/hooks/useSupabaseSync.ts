'use client';
/**
 * useSupabaseSync — Real-time cross-device sync via Supabase Realtime Broadcast.
 *
 * Uses a shared Supabase channel ('domrs-live-sync') to broadcast MOCK_STATE
 * updates to every connected client (phone, PC, tablet) instantly — zero backend
 * needed, works with the Vercel frontend alone.
 *
 * Flow:
 *   Any device mutates state → emitUpdate() → broadcasts via Supabase channel
 *   All other devices → receive broadcast → merge into MOCK_STATE → re-render
 */
import { useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { MOCK_STATE } from '@/services/mockData';

export const SYNC_CHANNEL = 'domrs-live-sync';
export const SYNC_EVENT   = 'state-update';

export function useSupabaseSync(load: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(SYNC_CHANNEL)
      .on(
        'broadcast',
        { event: SYNC_EVENT },
        ({ payload }) => {
          if (!payload) return;
          // Merge fresh state from the broadcasting device into our MOCK_STATE
          if (Array.isArray(payload.reports))    MOCK_STATE.reports    = payload.reports;
          if (Array.isArray(payload.alerts))     MOCK_STATE.alerts     = payload.alerts;
          if (Array.isArray(payload.broadcasts)) MOCK_STATE.broadcasts = payload.broadcasts;
          if (Array.isArray(payload.auditLogs))  MOCK_STATE.auditLogs  = payload.auditLogs;

          // Trigger re-render on this device
          window.dispatchEvent(new CustomEvent('domrs:update', { detail: { type: 'supabase' } }));
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
