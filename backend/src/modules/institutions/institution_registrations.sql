-- ============================================================
-- MERMS: institution_registrations table
-- Run this in the Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.institution_registrations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Step 1: Facility Information
    facility_name           TEXT NOT NULL,
    facility_type           TEXT NOT NULL,
    registration_number     TEXT NOT NULL,

    -- Step 2: Medical Director
    director_full_name      TEXT NOT NULL,
    professional_folio_number TEXT NOT NULL,
    institutional_email     TEXT NOT NULL,
    phone_number            TEXT NOT NULL,

    -- Step 3: Physical Location
    street_address          TEXT,
    city                    TEXT,
    state                   TEXT,
    lga                     TEXT,
    postal_code             TEXT,
    latitude                NUMERIC(10, 6),
    longitude               NUMERIC(10, 6),

    -- Step 4: Compliance
    data_sharing_consent    BOOLEAN NOT NULL DEFAULT FALSE,
    accountability_clause   BOOLEAN NOT NULL DEFAULT FALSE,

    -- File metadata (paths stored in Supabase Storage, not data here)
    operating_license_path  TEXT,
    director_id_path        TEXT,

    -- Workflow Status
    -- pending → mdcn_check → document_review → admin_review → approved | rejected
    status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN (
                                'pending',
                                'mdcn_check',
                                'document_review',
                                'admin_review',
                                'approved',
                                'rejected'
                            )),

    reviewer_notes          TEXT,
    reviewed_at             TIMESTAMPTZ,
    reviewed_by             UUID REFERENCES auth.users(id),

    -- Linked auth user (created on approval)
    user_id                 UUID REFERENCES auth.users(id),

    -- Timestamps
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_institution_registrations_status
    ON public.institution_registrations (status);

CREATE INDEX IF NOT EXISTS idx_institution_registrations_email
    ON public.institution_registrations (institutional_email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_institution_registrations_folio
    ON public.institution_registrations (professional_folio_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_institution_registrations_reg_number
    ON public.institution_registrations (registration_number);

-- ── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_institution_registrations_updated_at
    ON public.institution_registrations;

CREATE TRIGGER trg_institution_registrations_updated_at
    BEFORE UPDATE ON public.institution_registrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.institution_registrations ENABLE ROW LEVEL SECURITY;

-- Anon users can INSERT (submit a registration)
CREATE POLICY "Allow public registration submission"
    ON public.institution_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only the service role (backend) can SELECT/UPDATE
CREATE POLICY "Service role full access"
    ON public.institution_registrations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE public.institution_registrations IS
    'Stores multi-step institution onboarding registrations pending admin review.';

COMMENT ON COLUMN public.institution_registrations.status IS
    'Workflow state: pending → mdcn_check → document_review → admin_review → approved | rejected';

COMMENT ON COLUMN public.institution_registrations.operating_license_path IS
    'Path in Supabase Storage bucket (merms-docs) to the uploaded Operating License PDF.';

COMMENT ON COLUMN public.institution_registrations.director_id_path IS
    'Path in Supabase Storage bucket (merms-docs) to the uploaded Director Government ID.';
