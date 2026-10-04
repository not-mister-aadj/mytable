-- One welcome mail per "Jouw tafel" account (the account concept), sent
-- by the 15-minute cron 30 minutes after the quiz. The primary key is the
-- claim: a second run, or two at once, never sends it twice.
-- Safe to run twice.
CREATE TABLE IF NOT EXISTS account_welcome_emails (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  variant text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Same posture as the rest of the schema: server-only access.
ALTER TABLE account_welcome_emails ENABLE ROW LEVEL SECURITY;
