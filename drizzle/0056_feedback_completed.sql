-- The feedback page in steps: when someone reached the last screen (and saw
-- the next Sunday or the membership offer).
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS completed_at timestamptz;
