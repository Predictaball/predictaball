-- Drop the `country-` prefix from country league IDs in favour of just the
-- slugified team name (e.g. `south-africa`). User leagues use UUIDs now so
-- there's no risk of collision with these short IDs.
--
-- We can't UPDATE `league.id` directly because the FK
-- `league_membership.league_id -> league.id` is RESTRICT-on-update. So we:
--   1. Insert the new rows with the new IDs.
--   2. Repoint memberships at the new IDs.
--   3. Delete the old rows.

INSERT INTO league (id, name, kind)
SELECT regexp_replace(lower(t.name), '\s+', '-', 'g'), l.name, l.kind
FROM league l
JOIN team t ON l.id = 'country-' || t.id::text;

UPDATE league_membership lm
SET league_id = regexp_replace(lower(t.name), '\s+', '-', 'g')
FROM team t
WHERE lm.league_id = 'country-' || t.id::text;

DELETE FROM league WHERE id LIKE 'country-%';
