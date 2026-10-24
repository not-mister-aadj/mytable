-- What a booker tells about their +1, only for the table page (not on any profile).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intro_plus_one jsonb;
