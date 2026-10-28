-- "Wat maakte het zo leuk?" and "Wat kan beter?" on the feedback page:
-- the reasons people tapped (keys from src/lib/feedback-reasons.ts).
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS liked jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS disliked jsonb NOT NULL DEFAULT '[]'::jsonb;
