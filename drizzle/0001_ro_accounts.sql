CREATE TABLE IF NOT EXISTS ro_accounts (
 id TEXT PRIMARY KEY,
 token_hash TEXT UNIQUE NOT NULL,
 site_user_id TEXT,
 payload TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS ro_accounts_site_user_id_uq ON ro_accounts(site_user_id);
