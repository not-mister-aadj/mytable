-- "Laat je tafelvrienden weten dat je komt" at booking: true = their mutual
-- matches may get a mail with this guest's first name. Null = not asked.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tell_friends boolean;
