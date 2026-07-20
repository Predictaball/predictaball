-- Track when each user was sent the tournament-recap email. The send path
-- skips users whose recap_sent_at is set, so re-running the endpoint is
-- idempotent.
ALTER TABLE member ADD COLUMN IF NOT EXISTS recap_sent_at TIMESTAMPTZ;
