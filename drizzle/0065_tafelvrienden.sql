-- Tafelvrienden: a report can be withdrawn by whoever made it; admin keeps seeing it.
ALTER TABLE feedback_reports ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
