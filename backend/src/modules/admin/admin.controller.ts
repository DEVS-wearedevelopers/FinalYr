import { Hono } from 'hono';
import { AdminService } from './admin.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { syslog } from './system-logger.js';
import { supabase } from '../../supabase.js';

export function createAdminController(adminService: AdminService) {
    const router = new Hono();

    router.use('/*', requireAuth, requireRole(['eoc']));

    const handleCatch = (c: any, error: any, label?: string) => {
        const user = c.get('user') as any;
        // Always log server-side with full detail
        syslog.logRequestError({
            method: c.req.method,
            path: c.req.path,
            status: error.message?.includes('Validation') ? 400 : 500,
            error,
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
        });
        if (error.message?.includes('Validation failed')) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Something went wrong. Our team has been notified.' }, 500);
    };

    router.patch('/facilities/:id/status', async (c) => {
        try {
            const facilityId = c.req.param('id');
            const body = await c.req.json();
            const { status, facility } = await adminService.updateFacilityStatus(facilityId, body);
            return c.json({ message: `Facility ${status} successfully`, facility }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    router.post('/phos', async (c) => {
        try {
            const body = await c.req.json();
            const result = await adminService.appointPho(body);
            return c.json({ message: 'PHO appointed successfully', ...result }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    router.post('/protocols', async (c) => {
        try {
            const body = await c.req.json();
            const protocol = await adminService.addProtocol(body);
            return c.json({ message: 'Protocol added', protocol }, 201);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    router.post('/alerts/:id/override', async (c) => {
        try {
            const alertId = c.req.param('id');
            const user = c.get('user');
            const alert = await adminService.overrideAlert(alertId, user);
            return c.json({ message: 'AI Alert overridden', alert }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    router.post('/facilities/:id/blacklist', async (c) => {
        try {
            const facilityId = c.req.param('id');
            const body = await c.req.json();
            const facility = await adminService.blacklistFacility(facilityId, body);
            return c.json({ message: 'Facility blacklisted', facility }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    router.post('/phos/:id/revoke_broadcast', async (c) => {
        try {
            const phoId = c.req.param('id');
            const pho = await adminService.revokePhoBroadcast(phoId);
            return c.json({ message: 'Broadcast rights revoked', pho }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    // ── System Logs (EOC admin only) ─────────────────────────────────────────────────
    router.get('/logs', async (c) => {
        try {
            const level = c.req.query('level') as any;
            const limit = parseInt(c.req.query('limit') ?? '100');
            const offset = parseInt(c.req.query('offset') ?? '0');
            return c.json(syslog.getLogs({ level, limit, offset }), 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    router.get('/logs/stats', async (c) => {
        return c.json(syslog.stats(), 200);
    });

    router.delete('/logs', async (c) => {
        syslog.clear();
        syslog.info('Log buffer cleared by EOC admin', { path: '/admin/logs', method: 'DELETE' });
        return c.json({ message: 'Log buffer cleared.' }, 200);
    });

    // ── User Management (EOC admin only) ──────────────────────────────────────────────
    router.get('/users', async (c) => {
        try {
            const role = c.req.query('role');
            let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (role) query = query.eq('role', role);
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return c.json({ users: data, total: data?.length ?? 0 }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    // Toggle user active/inactive — sets a can_broadcast flag as a proxy for active status
    // A full deactivation would use supabase.auth.admin.updateUserById(id, { ban_duration: '876600h' })
    router.patch('/users/:id/status', async (c) => {
        try {
            const userId = c.req.param('id');
            const { active } = await c.req.json();
            if (typeof active !== 'boolean') return c.json({ error: 'active must be a boolean' }, 400);

            // Ban/unban via Supabase admin API
            const { error } = await supabase.auth.admin.updateUserById(userId, {
                ban_duration: active ? 'none' : '876600h', // 100 years = effectively permanent
            });
            if (error) throw new Error(error.message);

            syslog.warn(`User ${userId} ${active ? 'activated' : 'deactivated'} by EOC admin`, {
                method: 'PATCH', path: `/admin/users/${userId}/status`,
            });
            return c.json({ message: `User ${active ? 'activated' : 'deactivated'} successfully.` }, 200);
        } catch (error: any) {
            return handleCatch(c, error);
        }
    });

    return router;
}
