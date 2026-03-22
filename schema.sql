-- ==============================================================
-- MERMS Database Schema (Supabase)
-- Run this in the Supabase SQL Editor to create the necessary tables
-- ==============================================================

-- 1. Create Enums for statuses and roles
CREATE TYPE user_role AS ENUM ('eoc', 'pho', 'institution', 'civilian');
CREATE TYPE facility_status AS ENUM ('pending', 'approved', 'rejected', 'blacklisted');
CREATE TYPE alert_status AS ENUM ('pending_investigation', 'investigating', 'probable', 'confirmed', 'invalidated');
CREATE TYPE report_status AS ENUM ('Pending AI', 'Under PHO Review', 'Validated', 'Invalidated');
CREATE TYPE advisory_severity AS ENUM ('ADVISORY', 'WARNING', 'CRITICAL');

-- 2. Profiles Table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role DEFAULT 'civilian'::user_role NOT NULL,
    first_name TEXT,
    last_name TEXT,
    organization_id TEXT, -- E.g., 'zone-777', 'hospital-404'
    can_broadcast BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Facilities Table
CREATE TABLE public.facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status facility_status DEFAULT 'pending'::facility_status NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    blacklist_reason TEXT,
    data_quality_score INTEGER DEFAULT 100,
    last_report_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AI Alerts Table (Created by AI Engine)
CREATE TABLE public.ai_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id TEXT NOT NULL,
    cbs_score FLOAT NOT NULL, -- Confidence-Based Score
    status alert_status DEFAULT 'pending_investigation'::alert_status,
    investigated_by UUID REFERENCES public.profiles(id),
    investigated_at TIMESTAMP WITH TIME ZONE,
    overridden_by UUID REFERENCES public.profiles(id),
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sentinel Reports Table
CREATE TABLE public.sentinel_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submitted_by UUID REFERENCES public.profiles(id) NOT NULL,
    organization_id TEXT NOT NULL,
    alert_id UUID REFERENCES public.ai_alerts(id), -- If grouped into an anomaly
    patient_count INTEGER NOT NULL,
    origin_lat FLOAT NOT NULL,
    origin_lng FLOAT NOT NULL,
    origin_address TEXT,
    symptom_matrix JSONB NOT NULL, -- Storing as JSON array of strings
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    notes TEXT,
    status report_status DEFAULT 'Pending AI'::report_status NOT NULL,
    professional_id_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Response Protocols Table
CREATE TABLE public.response_protocols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Advisories Table
CREATE TABLE public.advisories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES public.facilities(id),
    zone_id TEXT NOT NULL,
    message TEXT NOT NULL,
    severity advisory_severity NOT NULL,
    issued_by UUID REFERENCES public.profiles(id),
    dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================
-- Optional: Row Level Security (RLS) enabled flag
-- You can enable these to strict access if needed, but since
-- your Node.js server uses the service role key or API keys 
-- to manage interactions, it's not strictly required right now.
-- ==============================================================

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, organization_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'firstName', 
    new.raw_user_meta_data->>'lastName', 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'civilian'::user_role),
    new.raw_user_meta_data->>'organizationId'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
