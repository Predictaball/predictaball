-- Backfill the `result` (which side went through) for matches that already
-- completed before endMatch started writing it. Without this, the Knockout Cup
-- sees `actual = NULL` for those ties and awards nobody any points.
--
-- Derived from the final score: a level score leaves result NULL (group-stage
-- draws never progress, and a knockout decided on penalties isn't recoverable
-- from the scoreline alone). Only completed matches with a decisive score and no
-- result yet are touched.

UPDATE match
SET result = CASE
    WHEN home_score > away_score THEN 'HOME'
    WHEN away_score > home_score THEN 'AWAY'
END
WHERE state = 'COMPLETED'
  AND result IS NULL
  AND home_score IS NOT NULL
  AND away_score IS NOT NULL
  AND home_score <> away_score;
