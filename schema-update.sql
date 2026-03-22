-- Add new columns to ai_alerts table
ALTER TABLE public.ai_alerts ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES public.sentinel_reports(id);
ALTER TABLE public.ai_alerts ADD COLUMN IF NOT EXISTS facility_id TEXT;
ALTER TABLE public.ai_alerts ADD COLUMN IF NOT EXISTS severity_index INTEGER;
ALTER TABLE public.ai_alerts ADD COLUMN IF NOT EXISTS symptom_weight FLOAT;
ALTER TABLE public.ai_alerts ADD COLUMN IF NOT EXISTS bypass_reason TEXT;

-- Safely create the new severity enum
DO $$
BEGIN
    CREATE TYPE advisory_severity AS ENUM ('ADVISORY', 'WARNING', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

-- Safely add the tracking columns to the existing facilities table
ALTER TABLE public.facilities
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS last_report_at TIMESTAMP WITH TIME ZONE;

-- Safely create the advisories table
CREATE TABLE IF NOT EXISTS public.advisories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES public.facilities(id),
    zone_id TEXT NOT NULL,
    message TEXT NOT NULL,
    severity advisory_severity NOT NULL,
    issued_by UUID REFERENCES public.profiles(id),
    dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
