-- ====================================================================
-- Community Outbreak Sentinel: PostgreSQL + PostGIS Schema Migration
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
    CREATE TYPE reporter_type AS ENUM ('self', 'family_member', 'asha_worker', 'community_volunteer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE symptom_stage AS ENUM ('cold_insomnia', 'mobility_loss', 'confusion', 'recovery', 'deceased', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_channel AS ENUM ('telegram_voice', 'telegram_text', 'icon_app', 'web_form');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE alert_channel AS ENUM ('telegram', 'email');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE cluster_status AS ENUM ('investigating', 'active', 'confirmed', 'dismissed', 'contained');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interview_conducted_by AS ENUM ('asha_worker', 'anm', 'medical_officer', 'field_epidemiologist');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Villages Directory Table
CREATE TABLE IF NOT EXISTS villages_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_name TEXT NOT NULL UNIQUE,
    district TEXT NOT NULL,
    ac_name TEXT,
    ac_no INTEGER,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    population INTEGER NOT NULL DEFAULT 5000,
    phc_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Symptom Reports Table
CREATE TABLE IF NOT EXISTS symptom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_type reporter_type NOT NULL DEFAULT 'self',
    subject_name TEXT DEFAULT 'Anonymous Resident',
    village_name TEXT NOT NULL,
    ward_or_area TEXT,
    location GEOGRAPHY(Point, 4326),
    symptom_stage symptom_stage NOT NULL,
    raw_transcript TEXT,
    structured_symptoms JSONB,
    report_channel report_channel NOT NULL DEFAULT 'telegram_voice',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ac_name TEXT,
    ac_no INTEGER,
    district TEXT,
    part_no INTEGER,
    serial_no INTEGER,
    relative_name TEXT,
    image_url TEXT,
    audio_recording_url TEXT,
    biometric_verified BOOLEAN DEFAULT FALSE,
    biometric_verified_by UUID
);

CREATE INDEX IF NOT EXISTS idx_symptom_reports_village_time ON symptom_reports(village_name, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_stage ON symptom_reports(symptom_stage);

-- 3. Clusters Table
CREATE TABLE IF NOT EXISTS clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_name TEXT NOT NULL,
    center_location GEOGRAPHY(Point, 4326),
    case_count INTEGER NOT NULL DEFAULT 0,
    matched_symptom_reports UUID[] DEFAULT '{}',
    detection_window_start TIMESTAMPTZ NOT NULL,
    detection_window_end TIMESTAMPTZ NOT NULL,
    severity_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status cluster_status NOT NULL DEFAULT 'investigating',
    alert_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clusters_status_severity ON clusters(status, severity_score DESC);

-- 4. Verbal Autopsies Table
CREATE TABLE IF NOT EXISTS verbal_autopsies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linked_symptom_report_id UUID REFERENCES symptom_reports(id) ON DELETE SET NULL,
    deceased_name TEXT NOT NULL,
    village_name TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    interview_raw_transcript TEXT NOT NULL,
    who_va_structured_data JSONB,
    probable_cause_category TEXT,
    interview_conducted_by interview_conducted_by NOT NULL DEFAULT 'asha_worker',
    date_of_death DATE NOT NULL,
    civil_registration_prompted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    audio_recording_url TEXT,
    biometric_verified BOOLEAN DEFAULT FALSE,
    biometric_verified_by UUID
);

-- 5. Alerts Log Table
CREATE TABLE IF NOT EXISTS alerts_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    channel alert_channel NOT NULL DEFAULT 'telegram',
    recipient TEXT NOT NULL,
    message_summary TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status TEXT NOT NULL DEFAULT 'sent'
);

-- 6. Schema Migrations Log Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema.sql')
ON CONFLICT (version) DO NOTHING;