CREATE TABLE IF NOT EXISTS likes (target_type TEXT NOT NULL CHECK(target_type IN ('post','comment')),target_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(target_type,target_id,user_id));
CREATE INDEX IF NOT EXISTS likes_target ON likes(target_type,target_id);
CREATE INDEX IF NOT EXISTS likes_user ON likes(user_id,created_at);
