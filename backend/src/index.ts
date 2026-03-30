import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authRouter } from './modules/auth/index.js';
import { reportsRouter } from './modules/reports/index.js';
import { alertsRouter } from './modules/alerts/index.js';
import { adminRouter } from './modules/admin/index.js';
import { institutionsRouter } from './modules/institutions/index.js';
import { syslog } from './modules/admin/system-logger.js';

dotenv.config();

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// ── Request timing + error logging middleware ─────────────────────────────────
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    const status = c.res.status;

    if (status >= 400) {
        const user = c.get('user') as any;
        syslog.logRequestError({
            method: c.req.method,
            path: c.req.path,
            status,
            error: { message: `HTTP ${status}` },
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            durationMs: duration,
        });
    } else if (status >= 200) {
        syslog.info(`${c.req.method} ${c.req.path}`, {
            method: c.req.method,
            path: c.req.path,
            status,
            durationMs: duration,
        });
    }
});

// ── Global error boundary ─────────────────────────────────────────────────────
app.onError((err, c) => {
    const user = c.get('user') as any;
    syslog.logRequestError({
        method: c.req.method,
        path: c.req.path,
        status: 500,
        error: { message: err.message },
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
    });
    return c.json({ error: 'Internal Server Error' }, 500);
});

// ── 404 boundary ──────────────────────────────────────────────────────────────
app.notFound((c) => {
    syslog.logRequestError({
        method: c.req.method,
        path: c.req.path,
        status: 404,
        error: { message: `Route not found: ${c.req.method} ${c.req.path}` },
    });
    return c.json({ error: 'Not Found' }, 404);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ status: 'ok', message: 'DOMRS API is running' }));

// ── Mount routers ─────────────────────────────────────────────────────────────
app.route('/auth', authRouter);
app.route('/reports', reportsRouter);
app.route('/alerts', alertsRouter);
app.route('/admin', adminRouter);
app.route('/institutions', institutionsRouter);

// ── Start HTTP server ─────────────────────────────────────────────────────────
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = serve({ fetch: app.fetch, port }, () => {
    console.log(`[HTTP] Server running on port ${port}`);
});

// ── WebSocket sync server — attached to SAME port as HTTP ────────────────────
// Clients connect to ws://host:PORT (same URL as API, just ws:// scheme).
// Any client that sends { type:'update', payload } gets it fanned out to
// every other connected client instantly — true cross-device real-time sync.
const wss = new WebSocketServer({ server: server as unknown as http.Server });

// Last known good state — sent to new clients so they catch up immediately
let latestState: Record<string, unknown> | null = null;

wss.on('connection', (ws: WebSocket) => {
    console.log(`[WS] Client connected (${wss.clients.size} total)`);

    // Send current state to the new client immediately
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
                latestState = msg.payload;
                const out = JSON.stringify({ type: 'state', payload: msg.payload });
                // Broadcast to every OTHER connected client
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(out);
                    }
                });
            }
        } catch { /* ignore malformed messages */ }
    });

    ws.on('close', () => {
        console.log(`[WS] Client disconnected (${wss.clients.size} remaining)`);
    });

    ws.on('error', (err) => {
        console.error('[WS] Error:', err.message);
    });
});

console.log(`[WS]  Sync server attached to ws://0.0.0.0:${port}`);