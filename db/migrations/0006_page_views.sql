-- Run once on an existing D1 database after migrations 0002–0005.
CREATE TABLE IF NOT EXISTS page_views (
 page TEXT PRIMARY KEY,
 views INTEGER NOT NULL DEFAULT 0 CHECK(views>=0),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
