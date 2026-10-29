-- Run once on an existing D1 database before deploying this admin build.
ALTER TABLE users ADD COLUMN chat_locked INTEGER NOT NULL DEFAULT 0
  CHECK(chat_locked IN (0,1));
ALTER TABLE users ADD COLUMN chat_lock_reason TEXT;
ALTER TABLE users ADD COLUMN chat_locked_at TEXT;
ALTER TABLE users ADD COLUMN chat_locked_by TEXT REFERENCES users(id);
