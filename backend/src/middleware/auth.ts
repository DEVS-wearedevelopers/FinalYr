import { Context, Next } from 'hono';
import { supabase } from '../supabase.js';

// Extend Hono Context to include user
declare module 'hono' {
    interface ContextVariableMap {
        user: {
            id: string;
            email: string;
            role: 'eoc' | 'pho' | 'institution' | 'civilian';
            organizationId?: string;
        };
    }
}

export const requireAuth = async (c: Context, next: Next) => {
    // TEMPORARY MOCK FOR TESTING
    const role = c.req.header('X-Mock-Role') || 'civilian';
    const orgId = c.req.header('X-Mock-OrgId') || 'test-org-123';

    c.set('user', {
        id: 'mock-user-uuid-1234',
        email: 'test@example.com',
        role: role as 'eoc' | 'pho' | 'institution' | 'civilian',
        organizationId: orgId
    });

    await next();
};

export const requireRole = (allowedRoles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user');

        if (!user || !allowedRoles.includes(user.role)) {
            return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
        }

        await next();
    };
};  