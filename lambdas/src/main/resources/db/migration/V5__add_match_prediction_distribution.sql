ALTER TABLE "match" ADD COLUMN IF NOT EXISTS home_predictions INT;
ALTER TABLE "match" ADD COLUMN IF NOT EXISTS draw_predictions INT;
ALTER TABLE "match" ADD COLUMN IF NOT EXISTS away_predictions INT;
