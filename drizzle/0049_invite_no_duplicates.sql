-- Invites: never two open mails for one address, and when a mail was claimed.
ALTER TABLE invite_sends ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS invite_sends_one_open_idx
  ON invite_sends (email_normalized)
  WHERE status IN ('queued', 'approved', 'sending');
