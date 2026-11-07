CREATE TABLE IF NOT EXISTS supporter_accounts (supporter_id TEXT PRIMARY KEY REFERENCES supporter_registry(id) ON DELETE CASCADE,email TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS supporter_accounts_email ON supporter_accounts(email);
