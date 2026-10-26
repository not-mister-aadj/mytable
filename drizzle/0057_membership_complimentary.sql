-- A free membership given by hand: no Stripe, no end date, Sunday Socials
-- included like a paying member. The person can end it in their account.
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS complimentary boolean NOT NULL DEFAULT false;
