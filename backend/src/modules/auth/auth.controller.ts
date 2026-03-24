import { Hono } from 'hono';
import { AuthService } from './auth.service.js';
import { supabase } from '../../supabase.js';

export function createAuthController(authService: AuthService) {
    const router = new Hono();

    router.post('/register', async (c) => {
        try {
            const body = await c.req.json();
            const user = await authService.registerUser(body);
            return c.json({ message: 'User registered successfully', user }, 201);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            if (error.message.includes('Auth Error')) {
                return c.json({ error: error.message }, 400);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    router.post('/login', async (c) => {
        try {
            const body = await c.req.json();
            const loginData = await authService.loginUser(body);
            return c.json({ message: 'Logged in successfully', ...loginData }, 200);
        } catch (error: any) {
            if (error.message.includes('Validation failed')) {
                return c.json({ error: 'Validation failed', details: error.message }, 400);
            }
            if (error.message.includes('Login Error')) {
                return c.json({ error: error.message }, 401);
            }
            return c.json({ error: 'Internal Server Error', details: error.message }, 500);
        }
    });

    // POST /auth/forgot-password — sends a Supabase password reset email.
    // Always returns 200 (prevents email enumeration).
    router.post('/forgot-password', async (c) => {
        try {
            const { email } = await c.req.json();
            if (!email || typeof email !== 'string') {
                return c.json({ error: 'email is required' }, 400);
            }
            const redirectTo = process.env.FRONTEND_URL
                ? `${process.env.FRONTEND_URL}/auth/reset-password`
                : 'http://localhost:3000/auth/reset-password';
            await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        } catch (_) {
            // swallow — always return 200 so emails can't be enumerated
        }
        return c.json({ message: 'If that email is registered, a reset link has been sent.' }, 200);
    });

    return router;
}
