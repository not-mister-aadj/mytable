-- "Was er iemand van je groep niet?" on the feedback page: booking ids of
-- tablemates someone didn't see, so we can tell who was a no-show.
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS missing jsonb NOT NULL DEFAULT '[]'::jsonb;
