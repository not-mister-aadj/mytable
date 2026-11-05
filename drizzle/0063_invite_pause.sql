-- A pause per person: no invites, reminders or check-ins about Sundays before this date
-- (e.g. Dry January). Sundays from this date on are invited as usual.
ALTER TABLE invite_subscribers ADD COLUMN IF NOT EXISTS paused_until date;
