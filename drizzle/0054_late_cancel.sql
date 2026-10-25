-- "Kun je toch niet?" on the table page: the seat stays paid and taken, the
-- guest drops out of the group and the Sunday mails. A note for ourselves.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_late_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_note text;
