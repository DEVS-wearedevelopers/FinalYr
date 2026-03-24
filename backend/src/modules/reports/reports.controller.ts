import { Hono } from 'hono';
import { ReportsService } from './reports.service.js';
import { requireAuth, requireRole, optionalAuth } from '../../middleware/auth.js';

export function createReportsController(reportsService: ReportsService) {
    const router = new Hono();

    // All GET routes require authentication
    router.use('/feed',      requireAuth);
    router.use('/analytics', requireAuth);
    router.use('/alerts',    requireAuth);
    router.use('/inbox',     requireAuth);

    // POST /reports — institution users submit via JWT, community users submit anonymously.
    // optionalAuth: validates the token when present, sets anonymous civilian context when absent.
    router.post('/', optionalAuth, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();

            // If authenticated, only institution users may submit (not eoc/civilian via JWT)
            if (user.id && user.role !== 'institution') {
                return c.json({
                    error: `Forbidden: authenticated report submission requires 'institution' role, got '${user.role}'`
                }, 403);
            }

            const { report, alert } = await reportsService.submitReport(user, body);
            return c.json({ message: 'Sentinel Report submitted successfully', report, alert }, 201);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            if (error.message.includes('Facility not linked')) {
                return c.json({ error: error.message }, 422);
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

    // Institution inbox: all active EOC advisories (visible to all institutions)
    router.get('/inbox', requireRole(['institution']), async (c) => {
        try {
            const { data, error } = await (reportsService as any).repo.getAllAdvisories();
            if (error) return c.json({ error: error.message }, 500);
            return c.json({ messages: data ?? [] }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // ── POST /reports/community ── PUBLIC, no JWT required ──────────────────
    // Civilians report symptoms from their LGA without an account.
    router.post('/community', async (c) => {
        try {
            const body = await c.req.json();

            // Validate minimal required fields
            const { lga, symptoms, severity, reporter_name, notes } = body;
            if (!lga || typeof lga !== 'string' || lga.trim() === '') {
                return c.json({ error: 'Validation failed', details: 'lga is required' }, 400);
            }
            if (!Array.isArray(symptoms) || symptoms.length === 0) {
                return c.json({ error: 'Validation failed', details: 'symptoms must be a non-empty array' }, 400);
            }
            if (typeof severity !== 'number' || severity < 1 || severity > 10) {
                return c.json({ error: 'Validation failed', details: 'severity must be a number between 1 and 10' }, 400);
            }

            // Anonymous community context — no user id or org
            const communityUser = {
                id:             null,
                email:          reporter_name || null,
                role:           'civilian' as const,
                organizationId: lga.trim(),   // use LGA as the org so CBS temporal trend works
            };

            const reportBody = {
                patientCount:   1,
                originLocation: { lat: 0, lng: 0, address: lga.trim() },
                symptomMatrix:  symptoms,
                severity,
                notes:          notes ?? undefined,
                source:         'community',
            };

            const { report, alert } = await reportsService.submitReport(communityUser, reportBody);
            return c.json({ message: 'Community report submitted — thank you', report, alert }, 201);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    return router;
}
