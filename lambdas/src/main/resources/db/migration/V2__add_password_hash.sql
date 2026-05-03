-- Ensure member table exists (normally created by Exposed, but needed here for ALTER)
CREATE TABLE IF NOT EXISTS member (
  id VARCHAR(40) NOT NULL UNIQUE,
  "firstName" VARCHAR(30) NOT NULL,
  "familyName" VARCHAR(30) NOT NULL,
  fixed_points INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

-- Add email, password_hash, and auth_provider for NextAuth auth
-- email defaults to NULL so existing members don't violate the unique index
ALTER TABLE member ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL;
ALTER TABLE member ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE member ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email';
CREATE UNIQUE INDEX IF NOT EXISTS member_email_idx ON member(email);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_token (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);
