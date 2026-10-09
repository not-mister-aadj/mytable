-- "Jouw tafel" without an account first: someone gives only an email, does
-- the quiz and sees "Kies je zondag"; the account (email code) comes when
-- they reserve. This row holds the quiz until then. The id is the guest
-- cookie, so only that browser (or a link from the welcome mail) opens it.
-- Safe to run twice.
CREATE TABLE IF NOT EXISTS jouw_tafel_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'nl',
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  lead_sent_at timestamptz,
  welcome_sent_at timestamptz,
  -- Set once the answers moved into a real account.
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jouw_tafel_guests_email_idx ON jouw_tafel_guests (email);

-- Same posture as the rest of the schema: server-only access.
ALTER TABLE jouw_tafel_guests ENABLE ROW LEVEL SECURITY;
