'use client';
/**
 * useSupabaseSync — hooks a dashboard into the singleton sync channel.
 *
 * Calls initSyncChannel() once to ensure the channel is subscribed,
 * then registers a listener for incoming state payloads.
 */
import { useEffect } from 'react';
import { MOCK_STATE } from '@/services/mockData';
import { initSyncChannel, onStateReceived } from '@/services/syncManager';

export function useSupabaseSync(load: () => void) {
  useEffect(() => {
    // Ensure the singleton channel is alive
    initSyncChannel();

    // Register listener for incoming payloads from other devices
    const unsub = onStateReceived((payload) => {
      if (Array.isArray(payload.reports))    MOCK_STATE.reports    = payload.reports    as typeof MOCK_STATE.reports;
      if (Array.isArray(payload.alerts))     MOCK_STATE.alerts     = payload.alerts     as typeof MOCK_STATE.alerts;
      if (Array.isArray(payload.broadcasts)) MOCK_STATE.broadcasts = payload.broadcasts as typeof MOCK_STATE.broadcasts;
      if (Array.isArray(payload.auditLogs))  MOCK_STATE.auditLogs  = payload.auditLogs  as typeof MOCK_STATE.auditLogs;

      // Trigger re-render on this device
      window.dispatchEvent(new CustomEvent('domrs:update', { detail: { type: 'supabase' } }));
      load();
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
