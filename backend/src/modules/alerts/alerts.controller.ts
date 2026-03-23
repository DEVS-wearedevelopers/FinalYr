import { Hono } from 'hono';
import { AlertsService } from './alerts.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export function createAlertsController(alertsService: AlertsService) {
    const router = new Hono();

    router.use('/*', requireAuth);

    // PHO Level 2 Features
    router.get('/inbox', requireRole(['pho']), async (c) => {
        try {
            const user = c.get('user');
            const inbox = await alertsService.getInbox(user);
            return c.json({ inbox }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.post('/:id/claim', requireRole(['pho']), async (c) => {
        try {
            const alertId = c.req.param('id');
            const user = c.get('user');
            const alert = await alertsService.claimAlert(alertId, user);
            return c.json({ message: 'Alert claimed', alert }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.patch('/:id/status', requireRole(['pho']), async (c) => {
        try {
            const alertId = c.req.param('id');
            const user = c.get('user');
            const body = await c.req.json();
            const { status, data } = await alertsService.updateStatus(alertId, user, body);

            return c.json({ message: `Alert status updated to ${status}`, alert: data }, 200);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.post('/broadcast', requireRole(['pho']), async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json().catch(() => ({}));
            const result = await alertsService.broadcastAlert(user, body.message);
            return c.json(result, 202);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.post('/:id/escalate', requireRole(['pho']), async (c) => {
        try {
            const alertId = c.req.param('id');
            const result = await alertsService.escalateAlert(alertId);
            return c.json(result, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // Civilian Level 0 Features — open to any authenticated user
    // (civilians whose JWT hasn't refreshed may have stale role; broadening avoids 403)
    router.get('/local', async (c) => {
        try {
            const lat = c.req.query('lat');
            const lng = c.req.query('lng');
            const alerts = await alertsService.getLocalAlerts(lat as string, lng as string);
            return c.json({ alerts }, 200);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Missing coordinates for local alerts' }, 400);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.get('/national', async (c) => {
        try {
            const trends = await alertsService.getNationalTrends();
            return c.json({ trends }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // PHO inbox: advisories from EOC
    router.get('/advisories', requireRole(['pho']), async (c) => {
        try {
            const { data, error } = await alertsService.getPhoAdvisories();
            if (error) return c.json({ error: error.message }, 500);
            return c.json({ messages: data ?? [] }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    return router;
}
