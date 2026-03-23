-- ============================================================
-- MERMS: Link institution@merms.test to their registration
-- Fixes uuid vs text type mismatch with explicit casts
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: See what types we're dealing with
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE (table_name = 'institution_registrations' AND column_name = 'id')
   OR (column_name = 'organization_id')
ORDER BY table_name;

-- Step 2: Perform the link with explicit casts on both sides
UPDATE profiles
SET organization_id = ir.id::text          -- cast uuid → text to match the profiles column
FROM institution_registrations ir
WHERE profiles.id = (
    SELECT id FROM auth.users WHERE email = 'institution@merms.test'
)
AND ir.institutional_email = 'institution@merms.test';

-- Step 3: Verify — should return one row with facility_name and status
SELECT
    p.id          AS user_id,
    p.role,
    p.organization_id,
    ir.facility_name,
    ir.status
FROM profiles p
JOIN institution_registrations ir
    ON ir.id = p.organization_id::uuid     -- cast text → uuid for the join
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'institution@merms.test');
