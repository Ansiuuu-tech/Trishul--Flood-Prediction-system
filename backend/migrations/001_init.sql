-- Trishul initial schema (PostgreSQL)
-- This mirrors the SQLAlchemy models in backend/app/models.py.
-- For local development, SQLAlchemy's create_all() handles table creation
-- automatically (see app/database.py). Use this migration when provisioning
-- a standalone PostgreSQL / Supabase database directly (e.g. via psql).

CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    population INTEGER DEFAULT 0,
    elevation_m DOUBLE PRECISION DEFAULT 0,
    slope_degrees DOUBLE PRECISION DEFAULT 0,
    terrain_risk DOUBLE PRECISION DEFAULT 0,
    geojson_polygon JSONB DEFAULT '{}'::jsonb,
    safe_location TEXT DEFAULT '',
    evacuation_route TEXT DEFAULT '',
    is_fictional BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES zones(id),
    source TEXT DEFAULT 'simulator',
    rainfall_mm_1h DOUBLE PRECISION DEFAULT 0,
    rainfall_mm_3h DOUBLE PRECISION DEFAULT 0,
    rainfall_mm_24h DOUBLE PRECISION DEFAULT 0,
    soil_moisture_pct DOUBLE PRECISION DEFAULT 0,
    tilt_degrees DOUBLE PRECISION DEFAULT 0,
    tilt_change_rate DOUBLE PRECISION DEFAULT 0,
    vibration_g DOUBLE PRECISION DEFAULT 0,
    battery_pct DOUBLE PRECISION DEFAULT 100,
    is_online BOOLEAN DEFAULT TRUE,
    recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_zone_id ON sensor_readings(zone_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings(recorded_at);

CREATE TABLE IF NOT EXISTS historical_events (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES zones(id),
    event_type TEXT DEFAULT 'landslide',
    event_date TIMESTAMPTZ DEFAULT now(),
    severity TEXT DEFAULT 'moderate',
    fatalities INTEGER DEFAULT 0,
    description TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_historical_events_zone_id ON historical_events(zone_id);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES zones(id),
    score DOUBLE PRECISION NOT NULL,
    level TEXT NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 0.8,
    rainfall_risk DOUBLE PRECISION DEFAULT 0,
    soil_risk DOUBLE PRECISION DEFAULT 0,
    tilt_risk DOUBLE PRECISION DEFAULT 0,
    vibration_risk DOUBLE PRECISION DEFAULT 0,
    terrain_risk DOUBLE PRECISION DEFAULT 0,
    history_risk DOUBLE PRECISION DEFAULT 0,
    reasons JSONB DEFAULT '[]'::jsonb,
    recommended_action TEXT DEFAULT '',
    estimated_lead_time_minutes INTEGER DEFAULT 0,
    data_quality_warning TEXT DEFAULT '',
    model_version TEXT DEFAULT 'risk-fusion-v1.0.0-demo',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_zone_id ON risk_assessments(zone_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_created_at ON risk_assessments(created_at);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES zones(id),
    level TEXT NOT NULL,
    previous_level TEXT DEFAULT 'Safe',
    message TEXT NOT NULL,
    reasons JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    delivery_channels JSONB DEFAULT '[]'::jsonb,
    acknowledged_by TEXT DEFAULT '',
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_zone_id ON alerts(zone_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT DEFAULT '',
    display_name TEXT DEFAULT '',
    hashed_password TEXT,
    role TEXT DEFAULT 'viewer',
    is_demo_account BOOLEAN DEFAULT TRUE,
    oauth_provider TEXT,
    oauth_id TEXT,
    avatar_url TEXT,
    home_zone_id TEXT REFERENCES zones(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_oauth_identity UNIQUE (oauth_provider, oauth_id)
);
