-- Trishul migration: add district column to zones table
-- Idempotent: IF NOT EXISTS guard ensures safe execution against PostgreSQL.
ALTER TABLE zones ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '';
