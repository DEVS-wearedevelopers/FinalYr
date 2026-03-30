-- ============================================================
-- DOMRS: Live DB migrations — run in Supabase SQL Editor
-- ============================================================

-- 1. Create & link test facility for institution@domrs.test
INSERT INTO public.facilities (id, name, status)
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'DOMRS Test Hospital',
    'approved'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

UPDATE public.profiles
SET organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
WHERE email = 'institution@domrs.test';

-- 2. Schema cleanup — drop deprecated columns
ALTER TABLE public.profiles         DROP COLUMN IF EXISTS can_broadcast;
ALTER TABLE public.facilities       DROP COLUMN IF EXISTS data_quality_score;
ALTER TABLE public.sentinel_reports DROP COLUMN IF EXISTS professional_id_hash;

-- 3. Add source field to sentinel_reports (for community vs institution reports)
ALTER TABLE public.sentinel_reports
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'institution'
    CHECK (source IN ('institution', 'community'));

-- 4. Relax NOT NULL constraints so community reports (no auth) can be inserted
ALTER TABLE public.sentinel_reports ALTER COLUMN submitted_by    DROP NOT NULL;
ALTER TABLE public.sentinel_reports ALTER COLUMN organization_id DROP NOT NULL;

-- 5. Verification
SELECT
    column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sentinel_reports'
ORDER BY ordinal_position;
