-- Automatic personal invites (one mail per person, on their own moment).
CREATE TABLE IF NOT EXISTS invite_subscribers (
  email_normalized text PRIMARY KEY,
  token text NOT NULL UNIQUE,
  -- { "Utrecht": "all" | "less" | "none" }; a city without an entry is "all".
  city_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invite_subscribers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS invite_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Short code in the mail's links (/r/{code}{n}).
  code text NOT NULL UNIQUE,
  email_normalized text NOT NULL,
  -- "invite" | "nudge" (clicked, not booked) | "checkin" (still interested?)
  kind text NOT NULL,
  -- "queued" | "approved" | "sent" | "skipped" | "failed"
  status text NOT NULL DEFAULT 'queued',
  scheduled_for timestamptz NOT NULL,
  event_ids text[] NOT NULL DEFAULT '{}',
  cities text[] NOT NULL DEFAULT '{}',
  is_member boolean NOT NULL DEFAULT false,
  locale text NOT NULL DEFAULT 'nl',
  subject text,
  body text,
  skip_reason text,
  resend_id text,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invite_sends_email_idx ON invite_sends (email_normalized);
CREATE INDEX IF NOT EXISTS invite_sends_status_idx ON invite_sends (status, scheduled_for);
ALTER TABLE invite_sends ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS invite_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id uuid NOT NULL REFERENCES invite_sends(id) ON DELETE CASCADE,
  -- The event clicked, or null for the "still interested" link.
  event_id text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invite_clicks_send_idx ON invite_clicks (send_id);
ALTER TABLE invite_clicks ENABLE ROW LEVEL SECURITY;
