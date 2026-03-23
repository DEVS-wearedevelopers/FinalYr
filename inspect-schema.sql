-- Run this first to see ALL NOT NULL columns in institution_registrations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'institution_registrations'
  AND table_schema = 'public'
ORDER BY ordinal_position;
