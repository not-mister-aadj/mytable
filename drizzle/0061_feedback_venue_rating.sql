-- "En {bar} zelf?" as 1 to 5 stars. venue_mood keeps the answers from before.
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS venue_rating smallint CHECK (venue_rating BETWEEN 1 AND 5);
-- Answers from before the stars, as stars: Hier wil ik terug 5, Fijne plek 4, Gaat wel 3, Niet mijn plek 1.
UPDATE booking_feedback SET venue_rating = CASE venue_mood WHEN 'great' THEN 5 WHEN 'good' THEN 4 WHEN 'meh' THEN 3 WHEN 'bad' THEN 1 END WHERE venue_rating IS NULL AND venue_mood IS NOT NULL;
