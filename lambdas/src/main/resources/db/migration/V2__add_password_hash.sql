-- Add email, password_hash, and auth_provider for NextAuth auth
ALTER TABLE member ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL;
ALTER TABLE member ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE member ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email';
CREATE UNIQUE INDEX IF NOT EXISTS member_email_idx ON member(email);
