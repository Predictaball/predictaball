-- Switch user-created league IDs to UUIDs.
-- System leagues (`global`, `country-<teamId>`) keep their string IDs; the
-- new `kind` column tells us which is which.

ALTER TABLE league ALTER COLUMN id TYPE VARCHAR(40);
ALTER TABLE league_membership ALTER COLUMN league_id TYPE VARCHAR(40);

ALTER TABLE league ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'USER';
UPDATE league SET kind = 'GLOBAL' WHERE id = 'global';
UPDATE league SET kind = 'COUNTRY' WHERE id LIKE 'country-%';
ALTER TABLE league ALTER COLUMN kind DROP DEFAULT;
