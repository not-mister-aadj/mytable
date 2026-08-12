-- Waitlist-first Sunday Table funnel: retire the separate priority_list
-- source (one waitlist, one meaning) and track which cohort each waitlist
-- signup has been invited to, since a single boolean can't express
-- "invited for March's Rotterdam girls-only table but not April's mixed one."

UPDATE waitlist_signups SET source = 'waitlist' WHERE source = 'priority_list';

CREATE TABLE IF NOT EXISTS sunday_table_waitlist_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_signup_id uuid NOT NULL REFERENCES waitlist_signups(id) ON DELETE CASCADE,
  city text NOT NULL,
  table_date date NOT NULL,
  table_type text NOT NULL,
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'nl',
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sunday_table_waitlist_invites_type_check
    CHECK (table_type IN ('girls_only', 'mixed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS sunday_table_waitlist_invites_unique
  ON sunday_table_waitlist_invites (waitlist_signup_id, city, table_date, table_type);
