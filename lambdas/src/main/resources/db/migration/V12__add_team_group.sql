-- Assign each of the 48 teams to its World Cup 2026 group (A-L).
-- "group" is a reserved word in Postgres, so it is always quoted.
-- Group letters match the official FIFA World Cup 2026 draw.

ALTER TABLE team ADD COLUMN IF NOT EXISTS "group" VARCHAR(1);

UPDATE team SET "group" = 'A' WHERE name IN ('mexico', 'south africa', 'south korea', 'czech republic');
UPDATE team SET "group" = 'B' WHERE name IN ('canada', 'switzerland', 'bosnia and herzegovina', 'qatar');
UPDATE team SET "group" = 'C' WHERE name IN ('brazil', 'morocco', 'haiti', 'scotland');
UPDATE team SET "group" = 'D' WHERE name IN ('united states', 'paraguay', 'australia', 'turkey');
UPDATE team SET "group" = 'E' WHERE name IN ('germany', 'curacao', 'ivory coast', 'ecuador');
UPDATE team SET "group" = 'F' WHERE name IN ('netherlands', 'japan', 'sweden', 'tunisia');
UPDATE team SET "group" = 'G' WHERE name IN ('belgium', 'egypt', 'iran', 'new zealand');
UPDATE team SET "group" = 'H' WHERE name IN ('spain', 'cape verde', 'saudi arabia', 'uruguay');
UPDATE team SET "group" = 'I' WHERE name IN ('france', 'senegal', 'norway', 'iraq');
UPDATE team SET "group" = 'J' WHERE name IN ('argentina', 'algeria', 'austria', 'jordan');
UPDATE team SET "group" = 'K' WHERE name IN ('portugal', 'dr congo', 'uzbekistan', 'colombia');
UPDATE team SET "group" = 'L' WHERE name IN ('england', 'croatia', 'ghana', 'panama');
