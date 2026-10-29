CREATE TABLE IF NOT EXISTS supporter_registry (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Đồng hành',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS supporter_registry_created ON supporter_registry(created_at DESC);
CREATE INDEX IF NOT EXISTS supporter_registry_category ON supporter_registry(category,created_at DESC);
