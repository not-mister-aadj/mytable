-- Run in Supabase SQL Editor after tables exist.
-- Site uses service role via DATABASE_URL; anon has no direct access.

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated = deny all direct client access
