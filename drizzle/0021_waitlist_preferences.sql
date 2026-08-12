-- waitlist_signups.preferences existed on production without ever being
-- captured in a migration file (added outside the tracked system at some
-- point) — that's exactly the kind of drift ensureDevSchema() is meant to
-- prevent going forward. Recording it here closes the gap.

ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS preferences jsonb;
