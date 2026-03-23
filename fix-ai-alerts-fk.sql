-- ============================================================
-- MERMS: Fix ai_alerts.facility_id FK constraint
-- The facility_id in ai_alerts stores institution_registrations.id
-- (a TEXT org identifier), not a UUID FK into the facilities table.
-- Drop the erroneous FK constraint so inserts succeed.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Step 1: Find and drop the FK constraint on ai_alerts.facility_id
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ai_alerts'::regclass
      AND contype = 'f'
      AND conkey = ARRAY(
          SELECT attnum FROM pg_attribute
          WHERE attrelid = 'public.ai_alerts'::regclass
            AND attname = 'facility_id'
      );

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.ai_alerts DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped FK constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No FK constraint found on ai_alerts.facility_id — nothing to do.';
    END IF;
END
$$;

-- Step 2: Ensure the column is TEXT (not UUID) to accept org string IDs
ALTER TABLE public.ai_alerts
    ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT;

-- Step 3: Also fix advisories.facility_id if needed — make it nullable TEXT
-- (advisories can stay UUID FK to facilities, that table is used for EOC-created advisories)
-- No change needed there.

-- Verify:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ai_alerts'
  AND column_name = 'facility_id';
