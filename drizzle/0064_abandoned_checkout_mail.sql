-- "Ging er iets mis?": when the mail about an unfinished booking went out.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS abandon_mail_sent_at timestamptz;
