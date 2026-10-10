-- The guest's date of birth, as given when booking (the date page's 18+
-- check, or the quiz answer for a booking made through "Kies je zondag").
-- Kept so tables can be grouped by age. Null for older bookings.
-- Safe to run twice.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS birth_date date;
