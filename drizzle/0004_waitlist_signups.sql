CREATE TABLE IF NOT EXISTS "waitlist_signups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "city" text NOT NULL,
  "locale" text DEFAULT 'nl' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_signups_email_city_unique"
  ON "waitlist_signups" ("email", "city");

CREATE INDEX IF NOT EXISTS "waitlist_signups_created_at_idx"
  ON "waitlist_signups" ("created_at" DESC);
