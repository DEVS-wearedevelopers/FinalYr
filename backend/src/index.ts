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

// ── Cross-device sync relay ────────────────────────────────────────────────────
// Simple in-memory relay: any device can push state, all devices poll for updates.
// Uses NEXT_PUBLIC_API_URL (already on Vercel) — no Supabase env vars needed.
// Polling every 1.5s also keeps render.com free tier from sleeping during demos.

type DeviceInfo = { role: string; user: string; ua: string; lastSeen: number; };
const _devices: Record<string, DeviceInfo> = {};
let _syncState: unknown = null;
let _syncTs = 0;

function pruneDevices() {
    const cutoff = Date.now() - 30_000;
    Object.keys(_devices).forEach(k => { if (_devices[k].lastSeen < cutoff) delete _devices[k]; });
}

function activeDeviceList() {
    pruneDevices();
    return Object.entries(_devices).map(([id, d]) => ({
        id,
        role:     d.role,
        user:     d.user,
        device:   /mobile|android|iphone|ipad|tablet/i.test(d.ua) ? 'mobile' : 'desktop',
        lastSeen: d.lastSeen,
    }));
}

// GET /sync/state?d=deviceId&r=role&u=userName
// Returns latest state + active device list. Also registers the caller as a live device.
app.get('/sync/state', (c) => {
    const deviceId = c.req.query('d') ?? '';
    const role     = c.req.query('r') ?? 'unknown';
    const user     = decodeURIComponent(c.req.query('u') ?? 'User');
    const ua       = c.req.header('user-agent') ?? '';
    if (deviceId) _devices[deviceId] = { role, user, ua, lastSeen: Date.now() };
    return c.json({ state: _syncState, ts: _syncTs, devices: activeDeviceList() });
});

// POST /sync/state  { state, ts, deviceId?, role?, user? }
// Stores state if ts is newer. Also registers the caller as a live device.
app.post('/sync/state', async (c) => {
    const body = await c.req.json() as { state?: unknown; ts?: number; deviceId?: string; role?: string; user?: string; };
    const { state, ts = 0, deviceId, role = 'unknown', user = 'User' } = body;
    if (ts > _syncTs && state) { _syncState = state; _syncTs = ts; }
    const ua = c.req.header('user-agent') ?? '';
    if (deviceId) _devices[deviceId] = { role, user, ua, lastSeen: Date.now() };
    return c.json({ ok: true, ts: _syncTs, devices: activeDeviceList() });
});

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