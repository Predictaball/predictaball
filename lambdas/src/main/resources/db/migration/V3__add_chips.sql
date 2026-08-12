-- Ensure prediction table exists (normally created by Exposed, but needed here for ALTER)
CREATE TABLE IF NOT EXISTS prediction (
  id SERIAL UNIQUE NOT NULL,
  member_id VARCHAR(40) NOT NULL REFERENCES member(id),
  match_id INT NOT NULL REFERENCES "match"(id),
  home_score INT NOT NULL CHECK (home_score >= 0),
  away_score INT NOT NULL CHECK (away_score >= 0),
  "result" VARCHAR(10),
  points INT CHECK (points >= 0 AND points <= 10),
  PRIMARY KEY (id),
  UNIQUE (member_id, match_id)
);

-- Add chips columns for prediction chips feature
ALTER TABLE member ADD COLUMN IF NOT EXISTS double_points_chips INT NOT NULL DEFAULT 3;
ALTER TABLE member ADD COLUMN IF NOT EXISTS one_out_chips INT NOT NULL DEFAULT 3;
ALTER TABLE prediction ADD COLUMN IF NOT EXISTS chip VARCHAR(20) NOT NULL DEFAULT 'NONE';
