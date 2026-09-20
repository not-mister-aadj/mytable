-- Per-event "notify me" mini waitlist for events that are visible but not
-- yet bookable (comingSoon in events.extras). Distinct from the general
-- waitlist_signups table: this is scoped to one specific event, and gets a
-- single "tickets are open" email once, not ongoing outreach.

CREATE TABLE IF NOT EXISTS event_notify_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'nl',
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  CONSTRAINT event_notify_signups_event_email_unique UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS event_notify_signups_event_id_idx
  ON event_notify_signups (event_id);
