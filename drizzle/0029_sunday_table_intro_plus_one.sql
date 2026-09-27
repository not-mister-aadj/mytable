-- "Meet your table": first name of the second guest on a 2-ticket Sunday
-- Table booking, filled in by the buyer. The two always sit together, so the
-- name is only used for the introductions, the seating plan and place cards.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS intro_plus_one_name text;
