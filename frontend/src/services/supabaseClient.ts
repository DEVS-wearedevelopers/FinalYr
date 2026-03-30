import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Shared Supabase client for the frontend.
 * Used for Realtime subscriptions — NOT for authenticated API calls
 * (those go through apiClient → the Node.js backend).
 */
export const supabase = createClient(supabaseUrl, supabaseAnon);