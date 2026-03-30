import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for the frontend.
 *
 * The anon key is intentionally PUBLIC — it's called "anon" because it is
 * designed for client-side use. These fallback values let the app work on
 * Vercel without requiring env vars to be manually configured.
 * Env vars still take priority if set.
 */
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  || 'https://rcuyvftcetetcxnkxykl.supabase.co';

const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdXl2ZnRjZXRldGN4bmt4eWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzgxNjUsImV4cCI6MjA4NzI1NDE2NX0.zbHGTvCRw4YLQIb2JjKthPxPT3t5NqTRuoqNWxv216U';

export const supabase = createClient(supabaseUrl, supabaseAnon);