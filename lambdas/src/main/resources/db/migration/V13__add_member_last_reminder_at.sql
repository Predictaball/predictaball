-- Track when each user last received a reminder email. The reminder sender
-- skips users whose last_reminder_at is on the same UTC day as the current
-- run, which makes the run idempotent if EventBridge retries.
ALTER TABLE member ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;
