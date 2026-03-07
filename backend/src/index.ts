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

dotenv.config();

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// Basic health check route
app.get('/', (c) => c.json({ status: 'ok', message: 'MERMS API is running' }));

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
