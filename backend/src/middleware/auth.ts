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
    console.log(`\n\n[AUTH DEBUG] 🚀 NEW REQUEST to ${c.req.url}`);
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[AUTH DEBUG] ❌ Missing or invalid Authorization header');
        return c.json({ error: 'Unauthorized: Missing or invalid token format' }, 401);
    }

    const token = authHeader.split(' ')[1];
    console.log(`[AUTH DEBUG] 🔑 Token extracted (first 15 chars): ${token.substring(0, 15)}...`);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('[AUTH DEBUG] ❌ Supabase auth.getUser error:', error?.message);
        return c.json({ error: `Unauthorized: Invalid token (${error?.message || 'No user'})` }, 401);
    }

    console.log(`[AUTH DEBUG] ✅ User validated natively via Supabase! ID=${user.id}`);
    console.log(`[AUTH DEBUG] 📦 User attached user_metadata:`, JSON.stringify(user.user_metadata));

    // Fetch profile reliably from DB since user_metadata can sometimes be stale or missing
    console.log(`[AUTH DEBUG] 🔍 Searching 'profiles' table for role/org definitions...`);
    const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

    if (dbError) {
        console.error('[AUTH DEBUG] ⚠️ Failed fetching from profiles table:', dbError.message);
    } else {
        console.log(`[AUTH DEBUG] ✅ Profiles DB row matched! role='${profile?.role}', organization_id='${profile?.organization_id}'`);
    }

    const rawRole = profile?.role || user.user_metadata?.role || 'civilian';
    const orgId = profile?.organization_id || user.user_metadata?.organizationId;

    const finalRole = String(rawRole).toLowerCase().trim();
    console.log(`[AUTH DEBUG] 🎯 Final Computed Role: '${finalRole}', OrgId: '${orgId}'`);

    c.set('user', {
        id: user.id,
        email: user.email!,
        role: finalRole as 'eoc' | 'pho' | 'institution' | 'civilian',
        organizationId: orgId
    });

    await next();
};

export const requireRole = (allowedRoles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user');

        console.log(`[AUTH DEBUG] 🛡️ Route restricted to: [${allowedRoles.join(', ')}] | Requesting user is: '${user?.role}'`);

        if (!user || !allowedRoles.includes(user.role)) {
            console.error(`[AUTH DEBUG] ❌ FORBIDDEN: User role '${user?.role}' is inherently blocked here!`);
            return c.json({ error: `Forbidden: Insufficient permissions. User role is ${user?.role || 'none'} but requires ${allowedRoles.join(',')}` }, 403);
        }

        console.log(`[AUTH DEBUG] ✅ ACCESS GRANTED to route!`);
        await next();
    };
};  