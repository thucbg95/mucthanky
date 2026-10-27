-- Run once on an existing D1 database after 0004_chat_moderation.sql.
CREATE TABLE IF NOT EXISTS admin_audit (
 id TEXT PRIMARY KEY,
 action TEXT NOT NULL CHECK(action IN ('comment_deleted','chat_locked','chat_unlocked')),
 actor_type TEXT NOT NULL CHECK(actor_type IN ('owner_token','admin')),
 actor_user_id TEXT,
 actor_label TEXT NOT NULL,
 target_user_id TEXT,
 target_comment_id TEXT,
 target_page TEXT,
 details TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS admin_audit_created ON admin_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_action ON admin_audit(action,created_at DESC);
