CREATE TABLE IF NOT EXISTS "sunday_table_signups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "city" text NOT NULL,
  "table_date" date NOT NULL,
  "table_type" text NOT NULL,
  "plan_id" text NOT NULL,
  "locale" text DEFAULT 'nl' NOT NULL,
  "user_id" uuid,
  "customer_id" uuid REFERENCES "customers"("id"),
  "profile" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "sunday_table_signups_table_type_check" CHECK ("table_type" IN ('girls_only', 'mixed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "sunday_table_signups_email_city_date_type_unique"
  ON "sunday_table_signups" (lower("email"), "city", "table_date", "table_type");

CREATE INDEX IF NOT EXISTS "sunday_table_signups_table_lookup_idx"
  ON "sunday_table_signups" ("table_date", "city", "table_type");

CREATE INDEX IF NOT EXISTS "sunday_table_signups_created_at_idx"
  ON "sunday_table_signups" ("created_at" DESC);

ALTER TABLE "sunday_table_signups" ENABLE ROW LEVEL SECURITY;
