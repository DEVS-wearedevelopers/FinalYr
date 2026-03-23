import { Hono } from 'hono';
import { InstitutionsService } from './institutions.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export function createInstitutionsController(service: InstitutionsService) {
    const router = new Hono();

    // POST /institutions/register — public, no auth required
    router.post('/register', async (c) => {
        try {
            const body = await c.req.json();
            const registration = await service.submitRegistration(body);
            return c.json({ message: 'Registration submitted successfully', registration }, 201);
        } catch (error: any) {
            if (error.message.startsWith('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // GET /institutions/profile — institution reads their own profile
    router.get('/profile', requireAuth, requireRole(['institution']), async (c) => {
        try {
            const user = c.get('user');
            if (!user.organizationId) return c.json({ error: 'No organization linked to this account' }, 404);
            const profile = await service.getRegistration(user.organizationId);
            return c.json({ profile }, 200);
        } catch (error: any) {
            return c.json({ error: 'Not Found', details: error.message }, 404);
        }
    });

    // PATCH /institutions/profile — institution updates low-risk self-service fields
    router.patch('/profile', requireAuth, requireRole(['institution']), async (c) => {
        try {
            const user = c.get('user');
            if (!user.organizationId) return c.json({ error: 'No organization linked to this account' }, 404);
            const body = await c.req.json();
            const updated = await service.updateOwnProfile(user.organizationId, body);
            return c.json({ message: 'Profile updated', profile: updated }, 200);
        } catch (error: any) {
            return c.json({ error: 'Bad Request', details: error.message }, 400);
        }
    });

    // GET /institutions — list all registrations
    router.get('/', async (c) => {
        try {
            const registrations = await service.getAllRegistrations();
            return c.json({ registrations }, 200);
        } catch (error: any) {
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // GET /institutions/:id — get a single registration
    router.get('/:id', async (c) => {
        try {
            const id = c.req.param('id');
            const registration = await service.getRegistration(id);
            return c.json({ registration }, 200);
        } catch (error: any) {
            return c.json({ error: 'Not Found', details: error.message }, 404);
        }
    });

    // PATCH /institutions/:id/status — admin: approve/reject
    router.patch('/:id/status', async (c) => {
        try {
            const id = c.req.param('id');
            const { status, reviewer_notes } = await c.req.json();
            const updated = await service.updateStatus(id, status, reviewer_notes);
            return c.json({ message: 'Status updated', registration: updated }, 200);
        } catch (error: any) {
            return c.json({ error: 'Bad Request', details: error.message }, 400);
        }
    });

    return router;
}
