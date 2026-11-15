-- A seat that came free after a late cancellation is offered to the Sunday's
-- waitlist, to who fits the group by age. So the waitlist keeps a birth date.
ALTER TABLE event_notify_signups ADD COLUMN IF NOT EXISTS birth_date date;

CREATE TABLE IF NOT EXISTS seat_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_id uuid REFERENCES event_groups(id) ON DELETE SET NULL,
  from_booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  offer_at timestamptz,
  offered_at timestamptz,
  offered_to jsonb NOT NULL DEFAULT '[]'::jsonb,
  held_by text,
  held_until timestamptz,
  claimed_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seat_releases_event_idx ON seat_releases (event_id);
-- Only the site (service role) reads and writes it.
ALTER TABLE seat_releases ENABLE ROW LEVEL SECURITY;
