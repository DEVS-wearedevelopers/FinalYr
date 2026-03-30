/**
 * DOMRS — WebSocket Sync Server
 *
 * A lightweight WS server that runs alongside Hono on a separate port (3002).
 * Any client can:
 *   - Connect and receive live `domrs:update` broadcasts
 *   - Send a `{ type: 'ping' }` heartbeat to keep alive
 *   - Send a `{ type: 'update', payload: <MOCK_STATE slices> }` to broadcast
 *     the new state to ALL other connected clients instantly.
 *
 * This solves the cross-device sync problem: phone ↔ PC ↔ laptop all share
 * the same in-memory state via this hub, no localStorage cross-device limit.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3002;

const wss = new WebSocketServer({ port: WS_PORT });

// In-memory state mirror — the last known good state
let latestState: Record<string, unknown> | null = null;

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const ip = req.socket.remoteAddress ?? 'unknown';
  console.log(`[WS] Client connected — ${ip} (${wss.clients.size} total)`);

  // Send the latest known state immediately so new tabs/devices catch up
  if (latestState) {
    ws.send(JSON.stringify({ type: 'state', payload: latestState }));
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (msg.type === 'update' && msg.payload) {
        // Store the latest state so new clients get it on connect
        latestState = msg.payload;

        // Broadcast to ALL other connected clients
        const out = JSON.stringify({ type: 'state', payload: msg.payload });
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(out);
          }
        });
      }
    } catch {
      // malformed message — ignore
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected (${wss.clients.size} remaining)`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
  });
});

console.log(`[WS] Sync server running on ws://0.0.0.0:${WS_PORT}`);

export { wss };
