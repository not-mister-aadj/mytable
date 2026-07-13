-- Consolidates all columns/tables that used to be created at runtime via
-- ensureVenueColumns / ensureBookingColumns / ensureExperienceTypesSchema.
-- Running DDL during requests over the Supabase transaction pooler holds table
-- locks and exhausts the connection pool, which stalled the whole site.
-- Apply this ONCE against the database, then the runtime DDL is gone for good.

-- Venues media / coordinates
ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS image_meta jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS gallery_meta jsonb;

-- Booking preferences
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seating_preference text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS table_language_preference text;

-- Fail a stuck query fast instead of holding a pool connection until the 300s
-- serverless timeout (which cascades into a site-wide stall). Applied per role so
-- it survives the transaction pooler; ignore errors if a role name differs.
DO $$
BEGIN
  BEGIN EXECUTE 'ALTER ROLE authenticator SET statement_timeout = ''15s'''; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'ALTER ROLE postgres SET statement_timeout = ''15s'''; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Experience types table
CREATE TABLE IF NOT EXISTS experience_types (
  slug text PRIMARY KEY,
  name_nl text NOT NULL,
  name_en text NOT NULL,
  mood text NOT NULL DEFAULT 'tastings',
  venue_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE experience_types ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb;
