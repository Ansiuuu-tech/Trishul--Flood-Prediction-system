-- Trishul migration: add OAuth/JWT columns to users
-- Run against an already-provisioned PostgreSQL / Supabase database that was
-- created from 001_init.sql (before this migration existed).
-- Idempotent: IF NOT EXISTS guards mean it is safe to re-run.

-- OAuth-only accounts have no password; email/password accounts keep the hash.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_zone_id TEXT REFERENCES zones(id);

-- Identity uniqueness for OAuth users (google/<sub>, facebook/<id>).
-- Only add if it does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_oauth_identity' AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT uq_oauth_identity UNIQUE (oauth_provider, oauth_id);
    END IF;
END $$;
