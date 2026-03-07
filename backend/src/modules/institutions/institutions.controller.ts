import { Hono } from 'hono';
import { InstitutionsService } from './institutions.service.js';

export function createInstitutionsController(service: InstitutionsService) {
    const router = new Hono();

    // POST /institutions/register — submit a new institution registration
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

    // GET /institutions — list all registrations (admin only in production)
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

    // PATCH /institutions/:id/status — update review status (admin action)
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
