CREATE TABLE IF NOT EXISTS "club_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "user_id" uuid,
  "customer_id" uuid REFERENCES "customers"("id"),
  "plan_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "stripe_checkout_session_id" text,
  "current_period_end" timestamptz,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "locale" text NOT NULL DEFAULT 'nl',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "club_memberships_status_check" CHECK ("status" IN ('pending', 'active', 'past_due', 'canceled')),
  CONSTRAINT "club_memberships_plan_check" CHECK ("plan_id" IN ('1m', '3m', '6m'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "club_memberships_stripe_subscription_unique"
  ON "club_memberships" ("stripe_subscription_id")
  WHERE "stripe_subscription_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "club_memberships_stripe_session_unique"
  ON "club_memberships" ("stripe_checkout_session_id")
  WHERE "stripe_checkout_session_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "club_memberships_email_idx"
  ON "club_memberships" (lower("email"));

CREATE INDEX IF NOT EXISTS "club_memberships_user_id_idx"
  ON "club_memberships" ("user_id")
  WHERE "user_id" IS NOT NULL;

ALTER TABLE "club_memberships" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sunday_table_signups"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN IF NOT EXISTS "plus_one" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "membership_id" uuid REFERENCES "club_memberships"("id"),
  ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" text,
  ADD COLUMN IF NOT EXISTS "cancelled_at" timestamptz;

ALTER TABLE "sunday_table_signups" DROP CONSTRAINT IF EXISTS "sunday_table_signups_status_check";
ALTER TABLE "sunday_table_signups"
  ADD CONSTRAINT "sunday_table_signups_status_check"
  CHECK ("status" IN ('pending_payment', 'confirmed', 'cancelled'));

CREATE INDEX IF NOT EXISTS "sunday_table_signups_membership_idx"
  ON "sunday_table_signups" ("membership_id")
  WHERE "membership_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "sunday_table_signups_status_idx"
  ON "sunday_table_signups" ("status");
