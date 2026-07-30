-- Sunday Table: confirmation dedupe + 24h location emails

ALTER TABLE sunday_table_signups
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_email_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS sunday_table_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  table_date date NOT NULL,
  table_type text NOT NULL,
  venue_name text NOT NULL,
  address text NOT NULL,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sunday_table_locations_type_check
    CHECK (table_type IN ('girls_only', 'mixed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS sunday_table_locations_key_unique
  ON sunday_table_locations (city, table_date, table_type);
