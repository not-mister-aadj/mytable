-- Where a waitlist signup or a new customer came from: the first visit
-- ever and the last campaign click, from the attribution cookies (see
-- src/lib/analytics/attribution.ts). Set once, never overwritten.
-- Safe to run twice.
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS attribution jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS attribution jsonb;
