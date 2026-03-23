import { Hono } from 'hono';
import { ReportsService } from './reports.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export function createReportsController(reportsService: ReportsService) {
    const router = new Hono();

    router.use('/*', requireAuth);

    router.post('/', requireRole(['institution']), async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const report = await reportsService.submitReport(user, body);

            return c.json({ message: 'Sentinel Report submitted successfully', report }, 201);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.get('/feed', requireRole(['institution']), async (c) => {
        try {
            const user = c.get('user');
            const reports = await reportsService.getFeed(user);
            return c.json({ reports }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.get('/analytics', requireRole(['institution']), async (c) => {
        try {
            const user = c.get('user');
            const data = await reportsService.getAnalytics(user);
            return c.json(data, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // Institution: see ai_alerts generated from their reports
    router.get('/alerts', requireRole(['institution']), async (c) => {
        try {
            const user = c.get('user');
            const { data, error } = await (reportsService as any).repo.getAlertsForOrg(user.organizationId);
            if (error) return c.json({ error: error.message }, 500);
            return c.json({ alerts: data ?? [] }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // Institution inbox: all active PHO advisories (visible to all institutions)
    router.get('/inbox', requireRole(['institution']), async (c) => {
        try {
            const { data, error } = await (reportsService as any).repo.getAllAdvisories();
            if (error) return c.json({ error: error.message }, 500);
            return c.json({ messages: data ?? [] }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    return router;
}
