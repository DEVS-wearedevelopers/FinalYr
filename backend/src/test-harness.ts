import { Hono } from 'hono';
import { reportsRouter } from './modules/reports/index.js';
import { alertsRouter } from './modules/alerts/index.js';
import { adminRouter } from './modules/admin/index.js';

// Create a special test router that injects a mock user into the context unconditionally
export const testHarnessRouter = new Hono();

// Middleware to mock authentication for testing
testHarnessRouter.use('*', async (c, next) => {
    // Extract a mock role from headers, default to eoc
    const rawRole = c.req.header('X-Mock-Role') || 'eoc';
    const role = rawRole as 'eoc' | 'pho' | 'institution' | 'civilian';
    const orgId = c.req.header('X-Mock-OrgId') || 'test-org-123';

    // Inject mock user
    c.set('user', {
        id: 'mock-user-uuid-1234',
        email: 'test@example.com',
        role,
        organizationId: orgId
    });

    await next();
});

// Since the original routers use standard `hono` instances and mount the middleware `requireAuth` 
// inside their respective controllers, we need to apply a dirty patch or simply run tests that 
// expect 401/403 if we don't remove `requireAuth` from the routes themselves. 
// A better way is to temporarily replace requireAuth in the middleware file.
