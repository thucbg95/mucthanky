PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, google_sub TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS oauth_states (state TEXT PRIMARY KEY,return_to TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS comments (
 id TEXT PRIMARY KEY, page TEXT NOT NULL, parent_id TEXT REFERENCES comments(id), user_id TEXT REFERENCES users(id),
 name TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending','approved','rejected')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS comments_page ON comments(page,status,created_at);
CREATE INDEX IF NOT EXISTS comments_global ON comments(status,created_at);
CREATE TABLE IF NOT EXISTS likes (target_type TEXT NOT NULL CHECK(target_type IN ('post','comment')),target_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(target_type,target_id,user_id));
CREATE INDEX IF NOT EXISTS likes_target ON likes(target_type,target_id);
CREATE INDEX IF NOT EXISTS likes_user ON likes(user_id,created_at);

CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY,comment_id TEXT NOT NULL REFERENCES comments(id),reason TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS episodes (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL,thumbnail TEXT,published_at TEXT NOT NULL,url TEXT NOT NULL,source TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'video',synced_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS episodes_published ON episodes(published_at DESC);
CREATE TABLE IF NOT EXISTS episode_schedule (
 number INTEGER PRIMARY KEY,title TEXT NOT NULL,date TEXT NOT NULL,url TEXT NOT NULL,cover TEXT,status TEXT NOT NULL CHECK(status IN ('released','scheduled')),
 ep_id TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS episode_schedule_date ON episode_schedule(date DESC);
CREATE TABLE IF NOT EXISTS sync_runs (id TEXT PRIMARY KEY,status TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
