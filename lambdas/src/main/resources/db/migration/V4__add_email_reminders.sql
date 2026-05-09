-- Add email reminders preference (default off)
ALTER TABLE member ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN NOT NULL DEFAULT FALSE;
