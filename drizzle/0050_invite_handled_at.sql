-- Invites: when a mail was sent, failed or skipped (the "Verstuurd" list sorts on it).
ALTER TABLE invite_sends ADD COLUMN IF NOT EXISTS handled_at timestamptz;
UPDATE invite_sends SET handled_at = coalesce(sent_at, claimed_at)
  WHERE handled_at IS NULL AND status IN ('sent', 'failed') AND coalesce(sent_at, claimed_at) IS NOT NULL;
CREATE INDEX IF NOT EXISTS invite_sends_handled_idx ON invite_sends (handled_at DESC);
