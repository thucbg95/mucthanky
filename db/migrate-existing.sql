PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,google_sub TEXT NOT NULL UNIQUE,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE comments ADD COLUMN user_id TEXT REFERENCES users(id);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS oauth_states (state TEXT PRIMARY KEY,return_to TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS comments_global ON comments(status,created_at);
CREATE TABLE IF NOT EXISTS episode_schedule (number INTEGER PRIMARY KEY,title TEXT NOT NULL,date TEXT NOT NULL,url TEXT NOT NULL,cover TEXT,status TEXT NOT NULL CHECK(status IN ('released','scheduled')),ep_id TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS episode_schedule_date ON episode_schedule(date DESC);
