CREATE TABLE IF NOT EXISTS saved_pages (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, slug)
);

CREATE INDEX IF NOT EXISTS saved_pages_user_created
  ON saved_pages(user_id, created_at DESC);
