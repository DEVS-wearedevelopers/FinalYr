import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
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

    // Log all 4xx/5xx automatically
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

// Basic health check route
app.get('/', (c) => c.json({ status: 'ok', message: 'DOMRS API is running' }));

// Mount routes
app.route('/auth', authRouter);
app.route('/reports', reportsRouter);
app.route('/alerts', alertsRouter);
app.route('/admin', adminRouter);
app.route('/institutions', institutionsRouter);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
