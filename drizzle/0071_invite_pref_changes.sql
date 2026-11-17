-- Every time someone changes which cities they get invites for, or
-- unsubscribes: when, through which button, what changed per city, and the
-- last invite they got before it. invite_subscribers only keeps the current state.
CREATE TABLE IF NOT EXISTS invite_pref_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  -- 'page' (the settings page), 'one_click' (the unsubscribe button of the mail app) or 'backfill'.
  source text NOT NULL,
  -- [{ "city": "Utrecht", "from": "all", "to": "none" }]
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- After this change they follow no city at all.
  unsubscribed boolean NOT NULL DEFAULT false,
  last_send_id uuid REFERENCES invite_sends(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS invite_pref_changes_changed_at_idx ON invite_pref_changes (changed_at);
-- Only the site (service role) reads and writes it.
ALTER TABLE invite_pref_changes ENABLE ROW LEVEL SECURITY;
