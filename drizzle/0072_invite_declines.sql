-- "Kan niet": someone can't come to one Sunday. Invites, reminders and
-- "bekende gezichten" mails skip that Sunday for them. Set by the guest with
-- the link in an invite ('mail') or by us in the admin ('admin').
CREATE TABLE IF NOT EXISTS invite_declines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source text NOT NULL,
  -- The invite whose link they used ('mail').
  send_id uuid REFERENCES invite_sends(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email_normalized, event_id)
);
CREATE INDEX IF NOT EXISTS invite_declines_event_idx ON invite_declines (event_id);
-- Only the site (service role) reads and writes it.
ALTER TABLE invite_declines ENABLE ROW LEVEL SECURITY;
