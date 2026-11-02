-- Missed Sundays (late cancel, no-show): a customer can be kept from booking until a date,
-- and admin can strike a single miss so it no longer counts.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS booking_blocked_until timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS miss_waived_at timestamptz;
