-- A member brings one guest for free every 3 months. This is the Sunday the
-- last free guest was booked for; the next one is there 3 months after it.
-- Null: never used, so available straight away.
-- Safe to run twice.
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS free_guest_used_for timestamptz;
