-- A report can be about the bar, and "iemand anders" can say who (someone from another table).
ALTER TABLE feedback_reports ADD COLUMN IF NOT EXISTS about_venue boolean NOT NULL DEFAULT false;
ALTER TABLE feedback_reports ADD COLUMN IF NOT EXISTS about_other_note text;
