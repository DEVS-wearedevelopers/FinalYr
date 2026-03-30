import { Context, Next } from 'hono';
import { supabase } from '../supabase.js';

// Extend Hono Context to include user
declare module 'hono' {
    interface ContextVariableMap {
        user: {
            id: string | null;
            email: string | null;
            role: 'eoc' | 'institution' | 'civilian' | 'pho';
            organizationId?: string;
        };
    }
}

export const requireAuth = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: Missing or invalid token format' }, 401);
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return c.json({ error: `Unauthorized: Invalid token (${error?.message || 'No user'})` }, 401);
    }

    // ── Role resolution priority ──────────────────────────────────────────────
    // 1. profiles table (canonical, set by admin/seed)
    // 2. user_metadata.role (set at registration, present in JWT claims)
    // 3. app_metadata.role (set server-side, highest trust but rarely used)
    // 4. Fall back to 'civilian'

    // Use maybeSingle() — never throws on empty result (vs single() which errors)
    const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .maybeSingle();

    if (dbError) {
        console.warn(`[auth] profiles lookup error for ${user.id}: ${dbError.message}`);
    }

    // Pull role from all possible locations, normalise to lowercase
    const rawRole = (
        profile?.role ||
        user.user_metadata?.role ||
        user.app_metadata?.role ||
        'civilian'
    );
    const finalRole = String(rawRole).toLowerCase().trim() as 'eoc' | 'institution' | 'civilian' | 'pho';

    // Pull org from profile or metadata fallback
    const orgId = profile?.organization_id || user.user_metadata?.organizationId;

    if (!profile && finalRole !== 'civilian') {
        console.warn(
            `[auth] ⚠️  No profile row for ${user.email} (${user.id}) ` +
            `— role resolved from token metadata as '${finalRole}'. ` +
            `Re-run mock-data-seed.sql to populate profiles table.`
        );
    }

    c.set('user', {
        id: user.id,
        email: user.email!,
        role: finalRole,
        organizationId: orgId,
    });

    await next();
};

export const requireRole = (allowedRoles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user');

        if (!user || !allowedRoles.includes(user.role)) {
            return c.json(
                {
                    error: `Forbidden: requires one of [${allowedRoles.join(', ')}], got '${user?.role || 'none'}'`,
                    hint: 'If you just registered, log out and back in so your role is included in the token.',
                },
                403
            );
        }

        await next();
    };
};

/**
 * optionalAuth — used on routes that accept unauthenticated (community) submissions.
 * - If a valid Bearer token is present: validates it and populates c.get('user') normally.
 * - If no token (or invalid header): sets an anonymous civilian context and continues.
 */
export const optionalAuth = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Token present — run full auth, let it 401 on invalid tokens
        return requireAuth(c, next);
    }

    // No token — anonymous community context
    c.set('user', {
        id:             null,
        email:          null,
        role:           'civilian',
        organizationId: undefined,
    });
    await next();
};