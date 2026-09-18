CREATE TABLE IF NOT EXISTS sos_requests (
    id TEXT PRIMARY KEY, reference_id TEXT UNIQUE NOT NULL, phone_number TEXT NOT NULL,
    name TEXT DEFAULT '', people_count INTEGER DEFAULT 1, situation_type TEXT NOT NULL,
    message TEXT DEFAULT '', latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    location_source TEXT DEFAULT 'unavailable', nearest_zone_id TEXT REFERENCES zones(id),
    nearest_zone_name TEXT DEFAULT '', district TEXT DEFAULT '', risk_level TEXT DEFAULT '',
    shelter_name TEXT DEFAULT '', shelter_latitude DOUBLE PRECISION, shelter_longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'Pending', status_note TEXT DEFAULT '', updated_by TEXT DEFAULT '',
    source_ip TEXT DEFAULT '', notification_channels JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sos_requests_status ON sos_requests(status);
CREATE INDEX IF NOT EXISTS idx_sos_requests_source_ip_created_at ON sos_requests(source_ip, created_at);
