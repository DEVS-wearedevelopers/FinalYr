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

    return router;
}
