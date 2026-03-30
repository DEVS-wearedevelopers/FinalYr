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

// Derive WS URL from the API base URL (swap http→ws, port 3001→3002)
// Falls back gracefully if the server isn't running.
function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  // Replace http(s) with ws(s) and swap port 3001 → 3002
  return apiBase
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws')
    .replace(/:3001$/, ':3002')
    .replace(/\/+$/, '');
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

        // Keep-alive ping every 25 s
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25_000);
        (ws as any)._pingInterval = ping;
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string);
          if (msg.type === 'state' && msg.payload) {
            // Merge directly into MOCK_STATE
            const p = msg.payload;
            if (Array.isArray(p.reports))    MOCK_STATE.reports    = p.reports;
            if (Array.isArray(p.alerts))     MOCK_STATE.alerts     = p.alerts;
            if (Array.isArray(p.broadcasts)) MOCK_STATE.broadcasts = p.broadcasts;
            if (Array.isArray(p.auditLogs))  MOCK_STATE.auditLogs  = p.auditLogs;

            // Fire the same-tab event so every dashboard re-renders
            window.dispatchEvent(new CustomEvent('domrs:update', { detail: { type: 'ws' } }));
            onUpdate?.();
          }
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        clearInterval((ws as any)._pingInterval);
        if (!destroyed.current) scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose → reconnect
      };
    }

    function scheduleReconnect() {
      if (destroyed.current) return;
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
