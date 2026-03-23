-- ============================================================
-- MERMS MOCK DATA SEED
-- Run in Supabase SQL Editor (Schema: public)
-- Covers: institution_registrations, zones, facilities,
--         sentinel_reports, ai_alerts, advisories, profiles
-- NOTE: Run test_users_seed.sql first to ensure auth users exist,
--       OR run the auth.users insert block below (service role only).
-- ============================================================

-- ── 0. Zones ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO zones (id, name, region) VALUES
    ('00000000-0000-0000-0001-000000000001', 'South West',    'Lagos'),
    ('00000000-0000-0000-0001-000000000002', 'North East',    'Borno'),
    ('00000000-0000-0000-0001-000000000003', 'North Central', 'Abuja'),
    ('00000000-0000-0000-0001-000000000004', 'North West',    'Kano'),
    ('00000000-0000-0000-0001-000000000005', 'South East',    'Anambra'),
    ('00000000-0000-0000-0001-000000000006', 'South South',   'Rivers')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── 1. Seed Auth Users (idempotent — skips rows whose email already exists) ───
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
SELECT gen_random_uuid(), 'institution@merms.test', crypt('MermsInst@2026', gen_salt('bf')), NOW(),
       '{"firstName":"Test","lastName":"Institution","role":"institution"}'::jsonb,
       NOW(), NOW(), 'authenticated', 'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'institution@merms.test');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
SELECT gen_random_uuid(), 'pho@merms.test', crypt('MermsPHO@2026', gen_salt('bf')), NOW(),
       '{"firstName":"Test","lastName":"PHO","role":"pho"}'::jsonb,
       NOW(), NOW(), 'authenticated', 'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pho@merms.test');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
SELECT gen_random_uuid(), 'eoc@merms.test', crypt('MermsEOC@2026', gen_salt('bf')), NOW(),
       '{"firstName":"Test","lastName":"EOC","role":"eoc"}'::jsonb,
       NOW(), NOW(), 'authenticated', 'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'eoc@merms.test');

-- ── 2. Profiles (look up real UUID from auth.users by email — works regardless
--    of whether users were created here or via Supabase Dashboard) ────────────
INSERT INTO public.profiles (id, email, role, first_name, last_name, organization_id, can_broadcast)
SELECT id, 'institution@merms.test', 'institution', 'Test', 'Institution',
       'aaaaaaaa-0000-0000-0000-000000000001', false
FROM auth.users WHERE email = 'institution@merms.test'
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    can_broadcast   = EXCLUDED.can_broadcast,
    role            = EXCLUDED.role;

INSERT INTO public.profiles (id, email, role, first_name, last_name, organization_id, can_broadcast)
SELECT id, 'pho@merms.test', 'pho', 'Test', 'PHO', NULL, true
FROM auth.users WHERE email = 'pho@merms.test'
ON CONFLICT (id) DO UPDATE SET
    can_broadcast = EXCLUDED.can_broadcast,
    role          = EXCLUDED.role;

INSERT INTO public.profiles (id, email, role, first_name, last_name, organization_id, can_broadcast)
SELECT id, 'eoc@merms.test', 'eoc', 'Test', 'EOC', NULL, true
FROM auth.users WHERE email = 'eoc@merms.test'
ON CONFLICT (id) DO UPDATE SET
    can_broadcast = EXCLUDED.can_broadcast,
    role          = EXCLUDED.role;

-- ── 3. Institution Registrations ─────────────────────────────────────────────
INSERT INTO institution_registrations (
    id, facility_name, facility_type, director_full_name,
    professional_folio_number,
    institutional_email, phone_number,
    lga, state, city,
    registration_number, status, created_at
) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'Lagos University Teaching Hospital', 'Teaching Hospital',
   'Prof. Chukwuemeka Obi', 'MDC/F/001234',
   'luth@example.ng', '+2348012345001',
   'Surulere', 'Lagos', 'Idi-Araba', 'MDC/2020/LG/001', 'approved',
   NOW() - INTERVAL '120 days'),

  ('aaaaaaaa-0000-0000-0000-000000000002',
   'Apapa General Hospital', 'General Hospital',
   'Dr. Ngozi Eze', 'MDC/F/008821',
   'apapa@example.ng', '+2348012345002',
   'Apapa', 'Lagos', 'Apapa', 'MDC/2021/LG/002', 'approved',
   NOW() - INTERVAL '90 days'),

  ('aaaaaaaa-0000-0000-0000-000000000003',
   'Aminu Kano Teaching Hospital', 'Teaching Hospital',
   'Dr. Sadiq Musa', 'MDC/F/032217',
   'akth@example.ng', '+2348012345003',
   'Kano Municipal', 'Kano', 'Kano Municipal', 'MDC/2021/KN/001', 'approved',
   NOW() - INTERVAL '80 days'),

  ('aaaaaaaa-0000-0000-0000-000000000004',
   'Garki Hospital Abuja', 'District Hospital',
   'Dr. Fatima Bello', 'MDC/F/019944',
   'garki@example.ng', '+2348012345004',
   'Abuja Municipal', 'FCT', 'Garki', 'MDC/2022/FC/001', 'mdcn_check',
   NOW() - INTERVAL '10 days'),

  ('aaaaaaaa-0000-0000-0000-000000000005',
   'University of Calabar Teaching Hospital', 'Teaching Hospital',
   'Dr. Blessing Okafor', 'MDC/F/027763',
   'ucth@example.ng', '+2348012345005',
   'Calabar Municipal', 'Cross River', 'Calabar', 'MDC/2022/CR/001', 'admin_review',
   NOW() - INTERVAL '5 days'),

  ('aaaaaaaa-0000-0000-0000-000000000006',
   'Maitama District Hospital', 'District Hospital',
   'Dr. Usman Abdullahi', 'MDC/F/041189',
   'maitama@example.ng', '+2348012345006',
   'Abuja Municipal', 'FCT', 'Maitama', 'MDC/2023/FC/002', 'pending',
   NOW() - INTERVAL '2 days')

ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    professional_folio_number = EXCLUDED.professional_folio_number,
    lga = EXCLUDED.lga;

-- ── 4. Sentinel Reports ───────────────────────────────────────────────────────
-- submitted_by → eeeeeeee-...-001 (institution test user)
-- origin_lat/lng: real coordinates for Nigerian locations
-- severity: 1–10
INSERT INTO sentinel_reports (
    id, submitted_by, organization_id,
    patient_count, symptom_matrix,
    origin_lat, origin_lng, origin_address,
    severity, notes, status,
    created_at
)
SELECT
    r.id,
    (SELECT id FROM auth.users WHERE email = 'institution@merms.test' LIMIT 1) AS submitted_by,
    r.organization_id, r.patient_count, r.symptom_matrix,
    r.origin_lat, r.origin_lng, r.origin_address,
    r.severity, r.notes, r.status::report_status, r.created_at
FROM (VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001'::uuid,
   'aaaaaaaa-0000-0000-0000-000000000001', 47,
   to_jsonb(ARRAY['fever','cough','chest pain','dyspnea']),
   6.8945, 3.7205, 'Babcock University Medical Centre, Ilishan-Remo',
   6, 'Cluster of respiratory presentations over 3-day period.',
   'Pending AI', NOW() - INTERVAL '8 days'),

  ('bbbbbbbb-0000-0000-0000-000000000002'::uuid,
   'aaaaaaaa-0000-0000-0000-000000000001', 12,
   to_jsonb(ARRAY['vomiting','diarrhoea','abdominal cramps']),
   6.8945, 3.7255, 'Student Health Clinic, Babcock University',
   4, 'Possible food contamination event at campus cafeteria.',
   'Pending AI', NOW() - INTERVAL '5 days'),

  ('bbbbbbbb-0000-0000-0000-000000000003'::uuid,
   'aaaaaaaa-0000-0000-0000-000000000002', 23,
   to_jsonb(ARRAY['high fever','headache','muscle pain','rash']),
   6.8895, 3.7220, 'Main Gate Clinic, Babcock University',
   7, 'Rash distribution pattern atypical — flagged for review.',
   'Under PHO Review', NOW() - INTERVAL '4 days'),

  ('bbbbbbbb-0000-0000-0000-000000000004'::uuid,
   'aaaaaaaa-0000-0000-0000-000000000003', 89,
   to_jsonb(ARRAY['fever','cough','night sweats','weight loss']),
   6.8925, 3.7285, 'Staff Quarters Clinic, Babcock University',
   7, 'High patient volume with TB-consistent symptoms.',
   'Validated', NOW() - INTERVAL '3 days'),

  ('bbbbbbbb-0000-0000-0000-000000000005'::uuid,
   'aaaaaaaa-0000-0000-0000-000000000003', 6,
   to_jsonb(ARRAY['unexplained bleeding','high fever','jaundice']),
   6.8958, 3.7270, 'Sports Complex First Aid, Babcock University',
   10, 'URGENT: Hemorrhagic presentation. Isolation initiated.',
   'Under PHO Review', NOW() - INTERVAL '1 day'),

  ('bbbbbbbb-0000-0000-0000-000000000006'::uuid,
   'aaaaaaaa-0000-0000-0000-000000000002', 34,
   to_jsonb(ARRAY['watery diarrhoea','vomiting','dehydration','muscle cramps']),
   6.8935, 3.7155, 'Oduduwa Hall Annex, Babcock University',
   8, 'Suspected outbreak following hall event.',
   'Pending AI', NOW() - INTERVAL '6 hours')
) AS r(id, organization_id, patient_count, symptom_matrix,
        origin_lat, origin_lng, origin_address,
        severity, notes, status, created_at)
ON CONFLICT (id) DO NOTHING;

-- ── 5. AI Alerts ─────────────────────────────────────────────────────────────
INSERT INTO ai_alerts (
    id, facility_id, zone_id, cbs_score, severity_index,
    status, symptom_weight, bypass_reason, created_at
) VALUES
  ('cccccccc-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001',
   '00000000-0000-0000-0001-000000000001',
   0.87, 9, 'confirmed', 0.91, NULL,
   NOW() - INTERVAL '8 days'),

  ('cccccccc-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001',
   '00000000-0000-0000-0001-000000000001',
   0.54, 5, 'investigating', 0.58, NULL,
   NOW() - INTERVAL '5 days'),

  ('cccccccc-0000-0000-0000-000000000003',
   'aaaaaaaa-0000-0000-0000-000000000002',
   '00000000-0000-0000-0001-000000000001',
   0.78, 7, 'probable', 0.82, NULL,
   NOW() - INTERVAL '4 days'),

  ('cccccccc-0000-0000-0000-000000000004',
   'aaaaaaaa-0000-0000-0000-000000000003',
   '00000000-0000-0000-0001-000000000004',
   0.62, 6, 'investigating', 0.67, NULL,
   NOW() - INTERVAL '3 days'),

  ('cccccccc-0000-0000-0000-000000000005',
   'aaaaaaaa-0000-0000-0000-000000000003',
   '00000000-0000-0000-0001-000000000004',
   0.95, 10, 'confirmed', 0.97, 'Hemorrhagic symptoms — bypass threshold applied',
   NOW() - INTERVAL '1 day'),

  ('cccccccc-0000-0000-0000-000000000006',
   'aaaaaaaa-0000-0000-0000-000000000002',
   '00000000-0000-0000-0001-000000000001',
   0.81, 8, 'pending_investigation', 0.85, NULL,
   NOW() - INTERVAL '6 hours'),

  ('cccccccc-0000-0000-0000-000000000007',
   'aaaaaaaa-0000-0000-0000-000000000001',
   '00000000-0000-0000-0001-000000000001',
   0.38, 3, 'invalidated', 0.40, NULL,
   NOW() - INTERVAL '12 days')

ON CONFLICT (id) DO NOTHING;

-- ── 6. Advisories ─────────────────────────────────────────────────────────────
-- zone_id is NOT NULL per schema — using zone string IDs
INSERT INTO advisories (
    id, message, severity, zone_id, dismissed, created_at
) VALUES
  ('dddddddd-0000-0000-0000-000000000001',
   'PHO Advisory: An increase in respiratory illness has been reported across South West facilities. All institutions should increase documentation frequency and report clusters of 5+ patients immediately.',
   'ADVISORY', '00000000-0000-0000-0001-000000000001', false,
   NOW() - INTERVAL '7 days'),

  ('dddddddd-0000-0000-0000-000000000002',
   'WARNING: Enteric disease cluster detected in the Lagos port area. Facilities near waterfront zones must implement enhanced sanitation protocols. Report any cholera-like presentations STAT.',
   'WARNING', '00000000-0000-0000-0001-000000000001', false,
   NOW() - INTERVAL '3 days'),

  ('dddddddd-0000-0000-0000-000000000003',
   '🚨 CRITICAL ALERT: Suspected hemorrhagic fever signals detected in North West zone. All facilities must isolate any patients presenting with unexplained bleeding and fever. Do NOT discharge without PHO clearance.',
   'CRITICAL', '00000000-0000-0000-0001-000000000004', false,
   NOW() - INTERVAL '1 day'),

  ('dddddddd-0000-0000-0000-000000000004',
   'EOC Notice: System-wide data quality audit in progress. All institutions are required to verify and resubmit reports from the past 30 days with updated patient count fields.',
   'ADVISORY', '00000000-0000-0000-0001-000000000003', false,
   NOW() - INTERVAL '2 hours')

ON CONFLICT (id) DO NOTHING;

-- ── 7. Link institution profile → registration ────────────────────────────────
UPDATE profiles
SET organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
WHERE id = (SELECT id FROM auth.users WHERE email = 'institution@merms.test' LIMIT 1);

-- ── 8. Verification ───────────────────────────────────────────────────────────
SELECT 'institution_registrations' AS tbl, COUNT(*) FROM institution_registrations
UNION ALL SELECT 'sentinel_reports',  COUNT(*) FROM sentinel_reports
UNION ALL SELECT 'ai_alerts',         COUNT(*) FROM ai_alerts
UNION ALL SELECT 'advisories',        COUNT(*) FROM advisories
UNION ALL SELECT 'profiles (test)',   COUNT(*) FROM profiles
           WHERE email IN ('institution@merms.test','pho@merms.test','eoc@merms.test');

-- Quick check: sentinel_reports.submitted_by should NOT be null
SELECT id, submitted_by, organization_id, severity, status
FROM sentinel_reports
ORDER BY created_at DESC;
