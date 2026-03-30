'use client';
/**
 * useWsSync — Real-time cross-device sync via WebSocket.
 *
 * Connects to the DOMRS WS sync server (port 3002).
 * When any other device/tab sends a state update the server fans it out here,
 * we merge it into MOCK_STATE and fire 'domrs:update' so ALL components reload.
 *
 * Handles: reconnection with exponential back-off, heartbeat ping, cleanup.
 */
import { useEffect, useRef } from 'react';
import { MOCK_STATE } from '@/services/mockData';
import { syncLog } from '@/services/syncLogger';

// WS is on the SAME port as the HTTP API — just swap the scheme.
// Works for: localhost:3001, 192.168.x.x:3001, merms-backend.onrender.com
function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
    .replace(/\/+$/, ''); // strip trailing slash
  return apiBase
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://');
}

export function useWsSync(onUpdate?: () => void) {
  const wsRef      = useRef<WebSocket | null>(null);
  const retryRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  const destroyed  = useRef(false);

  useEffect(() => {
    destroyed.current = false;

    function connect() {
      if (destroyed.current) return;
      const url = getWsUrl();
      if (!url) return;

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to sync server');
        retryDelay.current = 1000; // reset backoff on success
        syncLog.success('WS-RELAY', `Connected to sync server`, `url=${url} clients≥1`);

        // Keep-alive ping every 25 s
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
            syncLog.debug('WS-RELAY', 'Heartbeat ping sent');
          }
        }, 25_000);
        (ws as any)._pingInterval = ping;
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string);
          if (msg.type === 'pong') {
            syncLog.debug('WS-RELAY', 'Pong received ← server alive');
            return;
          }
          if (msg.type === 'state' && msg.payload) {
            // Merge directly into MOCK_STATE
            const p = msg.payload;
            let changed = false;
            if (Array.isArray(p.reports))    { MOCK_STATE.reports    = p.reports;    changed = true; }
            if (Array.isArray(p.alerts))     { MOCK_STATE.alerts     = p.alerts;     changed = true; }
            if (Array.isArray(p.broadcasts)) { MOCK_STATE.broadcasts = p.broadcasts; changed = true; }
            if (Array.isArray(p.auditLogs))  { MOCK_STATE.auditLogs  = p.auditLogs;  changed = true; }

            if (changed) {
              syncLog.info('WS-RELAY', `State received from remote device`,
                `reports=${p.reports?.length ?? '?'} alerts=${p.alerts?.length ?? '?'} broadcasts=${p.broadcasts?.length ?? '?'}`);
              // Fire the same-tab event so every dashboard re-renders
              window.dispatchEvent(new CustomEvent('domrs:update', { detail: { type: 'ws' } }));
              onUpdate?.();
            }
          }
        } catch { /* ignore malformed */ }
      };

      ws.onclose = (evt) => {
        clearInterval((ws as any)._pingInterval);
        syncLog.warn('WS-RELAY', `Disconnected (code=${evt.code})`, destroyed.current ? 'intentional unmount' : `reconnecting in ${retryDelay.current}ms`);
        if (!destroyed.current) scheduleReconnect();
      };

      ws.onerror = (err) => {
        syncLog.error('WS-RELAY', 'WebSocket error — closing', String((err as ErrorEvent).message ?? ''));
        ws.close(); // triggers onclose → reconnect
      };
    }

    function scheduleReconnect() {
      if (destroyed.current) return;
      syncLog.info('WS-RELAY', `Scheduling reconnect in ${retryDelay.current}ms`);
      retryRef.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 15_000); // cap at 15 s
        connect();
      }, retryDelay.current);
    }

    connect();

    return () => {
      destroyed.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) {
        clearInterval((wsRef.current as any)._pingInterval);
        wsRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return wsRef;
}
