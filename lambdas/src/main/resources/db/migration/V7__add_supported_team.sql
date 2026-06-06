-- Add the national team a member supports (nullable: OAuth members and existing
-- members set it via the onboarding step rather than at row creation time)
ALTER TABLE member ADD COLUMN IF NOT EXISTS supported_team_id INT REFERENCES team(id);
