import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
}

// Use Node's native fetch instead of undici (the auth-js default) which
// was causing ConnectTimeoutErrors in this environment.
export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: (...args) => globalThis.fetch(...args),
    },
});

