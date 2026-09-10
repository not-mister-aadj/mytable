-- Venue outreach: the cold-email funnel that turns a scraped prospect list
-- (see scripts/scrape-venue-prospects.ts) into booked wine-bar partners.
-- Four tables: who we target, what we send, what Resend reports back, and
-- what a human logged (their reply, a call, a note).

CREATE TABLE IF NOT EXISTS outreach_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  category text,
  address text,
  website text,
  email text,
  phone text,
  maps_url text,
  rating text,
  reviews_count integer,
  price_level text,
  contact_name text,
  status text NOT NULL DEFAULT 'new',
  -- How many sequence mails have gone out (0 = never mailed, 3 = full sequence).
  sequence_step integer NOT NULL DEFAULT 0,
  -- When the next sequence mail is due; cleared the moment they reply.
  next_follow_up_at timestamptz,
  last_contacted_at timestamptz,
  last_activity_at timestamptz,
  notes text,
  source text NOT NULL DEFAULT 'import',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS outreach_prospects_city_name_unique
  ON outreach_prospects (city, name);
CREATE INDEX IF NOT EXISTS outreach_prospects_status_idx
  ON outreach_prospects (status);
CREATE INDEX IF NOT EXISTS outreach_prospects_follow_up_idx
  ON outreach_prospects (next_follow_up_at);

CREATE TABLE IF NOT EXISTS outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  -- 'sequence' = step 1..n of the cold flow, 'reply' = answer to an inbound
  -- reply, 'other' = one-off.
  kind text NOT NULL DEFAULT 'sequence',
  step integer,
  -- Days to wait after the previous step before this one is due.
  delay_days integer NOT NULL DEFAULT 4,
  subject text NOT NULL,
  body text NOT NULL,
  attachment_path text,
  attachment_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES outreach_prospects(id) ON DELETE CASCADE,
  template_id uuid REFERENCES outreach_templates(id) ON DELETE SET NULL,
  -- Snapshots: the template can be edited later, the sent mail cannot.
  template_key text,
  step integer,
  to_email text NOT NULL,
  subject text NOT NULL,
  body_snapshot text NOT NULL,
  attachment_name text,
  resend_message_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  first_clicked_at timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  bounced_at timestamptz,
  complained_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS outreach_messages_resend_id_unique
  ON outreach_messages (resend_message_id)
  WHERE resend_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_messages_prospect_idx
  ON outreach_messages (prospect_id, sent_at DESC);

-- Raw Resend webhook log. Kept verbatim so a mapping bug can be replayed.
CREATE TABLE IF NOT EXISTS outreach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES outreach_messages(id) ON DELETE CASCADE,
  resend_message_id text,
  type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resend retries webhooks; the same (mail, type, timestamp) must not count twice.
CREATE UNIQUE INDEX IF NOT EXISTS outreach_events_dedupe
  ON outreach_events (resend_message_id, type, occurred_at);

CREATE TABLE IF NOT EXISTS outreach_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES outreach_prospects(id) ON DELETE CASCADE,
  message_id uuid REFERENCES outreach_messages(id) ON DELETE SET NULL,
  type text NOT NULL,
  body text,
  sentiment text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outreach_activities_prospect_idx
  ON outreach_activities (prospect_id, occurred_at DESC);

-- Same posture as the rest of the schema: the app connects as the owner via
-- DATABASE_URL, anon/authenticated get no direct access at all.
ALTER TABLE outreach_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;
