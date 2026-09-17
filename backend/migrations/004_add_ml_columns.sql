-- Trishul migration: add ML/hybrid risk columns to zones and risk_assessments
-- Idempotent: IF NOT EXISTS guard ensures safe execution against PostgreSQL.

-- Add ML feature columns to zones
ALTER TABLE zones ADD COLUMN IF NOT EXISTS seismic_zone TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS quake_count_100km_alltime INTEGER DEFAULT 0;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS historical_flood_freq DOUBLE PRECISION DEFAULT 0;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS historical_landslide_freq DOUBLE PRECISION DEFAULT 0;

-- Persist the rainfall windows used by the model, rather than silently
-- replacing its important three- and seven-day features with zeroes.
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS rainfall_mm_3d DOUBLE PRECISION DEFAULT 0;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS rainfall_mm_7d DOUBLE PRECISION DEFAULT 0;

-- Add ML probability column to risk_assessments
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS ml_probability DOUBLE PRECISION;
