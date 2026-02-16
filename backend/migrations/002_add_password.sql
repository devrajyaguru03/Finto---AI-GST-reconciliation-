-- Add password_hash column for email/password authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Index for faster logins (though email is already unique/indexed)
-- No new index needed for password_hash content, but we might want to ensure email index exists (it does)
