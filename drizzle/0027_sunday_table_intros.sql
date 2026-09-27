-- "Meet your table": short, optional introduction a Sunday Table guest fills
-- in right after payment (or via the reminder email), used for the
-- introductions sent to the table before the event, the seating plan and the
-- place cards. Only shared with tablemates when intro_share_consent is true.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS intro_ask_me_about text,
  ADD COLUMN IF NOT EXISTS intro_favorite_spot text,
  ADD COLUMN IF NOT EXISTS intro_wine text,
  ADD COLUMN IF NOT EXISTS intro_into_now text,
  ADD COLUMN IF NOT EXISTS intro_share_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intro_answered_at timestamptz,
  -- Set when the one "introduce yourself" reminder email is claimed, so it is
  -- never sent twice.
  ADD COLUMN IF NOT EXISTS intro_request_sent_at timestamptz;
