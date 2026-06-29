-- Seed bracket_position for the 2026 World Cup Round of 32.
--
-- bracket_position numbers the 16 R32 ties 1..16 in top-to-bottom bracket order
-- (as drawn on the official bracket). Consecutive pairs feed each Round of 16
-- tie: winners of 1&2 meet, 3&4 meet, ... 15&16 meet; those R16 winners pair up
-- the same way into the quarter-finals, and so on. Storing only the R32 slots
-- lets the Knockout Cup frontend order the round correctly and derive the rest
-- of the tree by pairing.
--
-- Matches are identified by their (unordered) team pair: R32 participants are
-- known, and each pairing is unique, so home/away orientation does not matter.
-- Group-stage and later-round rows keep bracket_position NULL.

ALTER TABLE match ADD COLUMN IF NOT EXISTS bracket_position INT;

UPDATE match SET bracket_position = 1
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('germany', 'paraguay'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('germany', 'paraguay'));

UPDATE match SET bracket_position = 2
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('france', 'sweden'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('france', 'sweden'));

UPDATE match SET bracket_position = 3
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('south africa', 'canada'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('south africa', 'canada'));

UPDATE match SET bracket_position = 4
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('netherlands', 'morocco'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('netherlands', 'morocco'));

UPDATE match SET bracket_position = 5
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('portugal', 'croatia'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('portugal', 'croatia'));

UPDATE match SET bracket_position = 6
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('spain', 'austria'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('spain', 'austria'));

UPDATE match SET bracket_position = 7
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('united states', 'bosnia and herzegovina'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('united states', 'bosnia and herzegovina'));

UPDATE match SET bracket_position = 8
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('belgium', 'senegal'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('belgium', 'senegal'));

UPDATE match SET bracket_position = 9
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('brazil', 'japan'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('brazil', 'japan'));

UPDATE match SET bracket_position = 10
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('ivory coast', 'norway'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('ivory coast', 'norway'));

UPDATE match SET bracket_position = 11
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('mexico', 'ecuador'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('mexico', 'ecuador'));

UPDATE match SET bracket_position = 12
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('england', 'dr congo'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('england', 'dr congo'));

UPDATE match SET bracket_position = 13
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('argentina', 'cape verde'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('argentina', 'cape verde'));

UPDATE match SET bracket_position = 14
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('australia', 'egypt'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('australia', 'egypt'));

UPDATE match SET bracket_position = 15
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('switzerland', 'algeria'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('switzerland', 'algeria'));

UPDATE match SET bracket_position = 16
WHERE round = 'ROUND_OF_THIRTY_TWO'
  AND home_team_id IN (SELECT id FROM team WHERE name IN ('colombia', 'ghana'))
  AND away_team_id IN (SELECT id FROM team WHERE name IN ('colombia', 'ghana'));
