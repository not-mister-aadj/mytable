-- Partner selection on the Sunday Social page: every partner bar of a city
-- shows there; which ones we reserved on a Sunday only a member sees, and
-- a member picks one of those.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS partner boolean NOT NULL DEFAULT false;
-- Seats we hold at a reserved bar on one Sunday; empty = no limit shown.
ALTER TABLE event_venues ADD COLUMN IF NOT EXISTS seats integer;
-- The bar a member picked when booking.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS preferred_venue_id uuid REFERENCES venues(id) ON DELETE SET NULL;
-- Every bar we have reserved at before is a partner.
UPDATE venues SET partner = true WHERE id IN (SELECT venue_id FROM event_venues);
