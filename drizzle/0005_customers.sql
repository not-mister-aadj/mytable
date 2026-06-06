CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "email_normalized" text NOT NULL,
  "first_name" text,
  "last_name" text,
  "phone" text,
  "preferred_city" text,
  "language" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "first_seen_at" timestamptz DEFAULT now() NOT NULL,
  "last_seen_at" timestamptz DEFAULT now() NOT NULL,
  "first_booking_at" timestamptz,
  "last_booking_at" timestamptz,
  "total_bookings" integer DEFAULT 0 NOT NULL,
  "paid_bookings_count" integer DEFAULT 0 NOT NULL,
  "cancelled_bookings_count" integer DEFAULT 0 NOT NULL,
  "moved_bookings_count" integer DEFAULT 0 NOT NULL,
  "failed_payments_count" integer DEFAULT 0 NOT NULL,
  "waitlist_count" integer DEFAULT 0 NOT NULL,
  "total_spent_cents" integer DEFAULT 0 NOT NULL,
  "total_seats_booked" integer DEFAULT 0 NOT NULL,
  "favorite_city" text,
  "favorite_event_type" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "notes" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_normalized_unique"
  ON "customers" ("email_normalized");

CREATE TABLE IF NOT EXISTS "customer_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id"),
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "metadata" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "customer_activities_customer_id_idx"
  ON "customer_activities" ("customer_id", "created_at" DESC);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_id" uuid REFERENCES "customers"("id");
CREATE INDEX IF NOT EXISTS "bookings_customer_id_idx" ON "bookings" ("customer_id");

ALTER TABLE "waitlist_signups" ADD COLUMN IF NOT EXISTS "customer_id" uuid REFERENCES "customers"("id");
