-- Add chips columns for prediction chips feature
ALTER TABLE member ADD COLUMN IF NOT EXISTS double_points_chips INT NOT NULL DEFAULT 3;
ALTER TABLE member ADD COLUMN IF NOT EXISTS one_out_chips INT NOT NULL DEFAULT 3;
ALTER TABLE prediction ADD COLUMN IF NOT EXISTS chip VARCHAR(20) NOT NULL DEFAULT 'NONE';
