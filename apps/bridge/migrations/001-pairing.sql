CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('owner','controller','observer')), created_at INTEGER NOT NULL, revoked_at INTEGER);
CREATE TABLE IF NOT EXISTS pairings (id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, claimed_at INTEGER, claim_hash TEXT, device_name TEXT, platform TEXT, approved_at INTEGER, device_id TEXT REFERENCES devices(id), sealed_token TEXT, delivered_at INTEGER);
CREATE TABLE IF NOT EXISTS sessions (id_hash TEXT PRIMARY KEY, device_id TEXT NOT NULL REFERENCES devices(id), csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
PRAGMA user_version = 1;
