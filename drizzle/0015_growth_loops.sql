-- Growth loops: scarcity helpers, lifecycle emails, referral, affiliate

ALTER TABLE sunday_table_signups
  ADD COLUMN IF NOT EXISTS attended_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS culinary_email_sent_at timestamptz;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS from_sunday_table boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid,
  email text NOT NULL,
  membership_id uuid REFERENCES club_memberships(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_email_unique
  ON referral_codes (lower(email));

CREATE TABLE IF NOT EXISTS referral_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES referral_codes(id),
  referee_email text NOT NULL,
  referee_user_id uuid,
  status text NOT NULL DEFAULT 'signed_up',
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_attributions_referee_unique
  ON referral_attributions (lower(referee_email));

CREATE TABLE IF NOT EXISTS affiliate_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  commission_cents_per_ticket integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code_id uuid NOT NULL REFERENCES affiliate_codes(id),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_commissions_booking_unique
  ON affiliate_commissions (booking_id);
