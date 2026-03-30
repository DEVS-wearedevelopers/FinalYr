-- ============================================================
-- DOMRS Migration: Add PHO role
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Step 1: Add 'pho' to the user_role enum (no-op if already present)
-- Note: Postgres does not support IF NOT EXISTS for ALTER TYPE ADD VALUE,
-- so we check the pg_enum catalog first.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'pho'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'pho';
    END IF;
END $$;

-- Step 2: Seed PHO demo account
-- This creates the auth user AND the profile row for the demo.
-- Run via Supabase Dashboard > SQL Editor (requires service_role key).
-- If using the Supabase JS Admin API instead, adapt accordingly.

-- Note: You can also create the user manually in Supabase Auth UI 
-- with email: pho@domrs.test, password: PHO1234, then run the profile INSERT below.

-- After creating the auth user, get its UUID and replace <PHO_USER_UUID>:
-- INSERT INTO public.profiles (id, email, role, first_name, last_name)
-- VALUES ('<PHO_USER_UUID>', 'pho@domrs.test', 'pho', 'Field', 'Officer')
-- ON CONFLICT (id) DO UPDATE SET role = 'pho';

-- ============================================================
-- VERIFY: After running, check the enum has pho:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
-- ============================================================
