-- The club-membership (Sunday Table Club) product is gone in practice:
-- /clubmember, /account, and /join were deleted 2026-08-15 and sign-ups
-- have been paused since. This drops the last of its backend plumbing.
-- The one existing row is the founder's own pending test signup, no real
-- customer or Stripe subscription is affected.
ALTER TABLE sunday_table_signups DROP COLUMN IF EXISTS membership_id;
DROP TABLE IF EXISTS club_memberships;
