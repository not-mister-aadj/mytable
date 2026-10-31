-- "En {bar} zelf?" as 1 to 5 stars. Earlier answers stay in venue_mood.
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS venue_rating smallint CHECK (venue_rating BETWEEN 1 AND 5);
