-- Sunday Table membership: a Stripe subscription (with a schedule for the
-- 4-month and 1-year plans: first period upfront, then monthly), included
-- seats for members, early booking for members, and no-shows.
-- Safe to run twice.

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Supabase auth user. Null once the account is deleted (the row stays for
  -- the administration, like bookings).
  user_id uuid,
  email text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  locale text NOT NULL DEFAULT 'nl',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_schedule_id text,
  stripe_checkout_session_id text,
  -- End of the first (upfront) period; after it the plan bills monthly.
  initial_period_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  no_show_count integer NOT NULL DEFAULT 0,
  no_show_warned_at timestamptz,
  booking_blocked_until timestamptz,
  -- Idempotency for the mails and the Meta Subscribe event.
  welcome_email_sent_at timestamptz,
  reminder_sent_at timestamptz,
  cancel_email_sent_for timestamptz,
  meta_subscribe_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_plan_check CHECK (plan IN ('1m', '4m', '12m')),
  CONSTRAINT memberships_status_check CHECK (status IN ('active', 'past_due', 'canceled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS memberships_stripe_subscription_unique
  ON memberships (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- One running membership per account.
CREATE UNIQUE INDEX IF NOT EXISTS memberships_user_running_unique
  ON memberships (user_id)
  WHERE user_id IS NOT NULL AND status <> 'canceled';

CREATE INDEX IF NOT EXISTS memberships_email_idx ON memberships (lower(email));
CREATE INDEX IF NOT EXISTS memberships_status_idx ON memberships (status);

-- Same posture as the rest of the schema: the app connects as the owner via
-- DATABASE_URL, anon/authenticated get no direct access at all.
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- A member's booking: amount_cents is 0 for the member's own seat, plus the
-- guest's member price on a 2-seat booking. Revenue reporting keeps reading
-- amount_cents, so a free seat adds nothing.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  -- Admin "Niet gekomen".
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_membership_idx
  ON bookings (membership_id)
  WHERE membership_id IS NOT NULL;

-- Members book a new Sunday Table first; everyone else from this moment.
-- Null means open to everyone (all tables published before this existed).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS members_only_until timestamptz;
