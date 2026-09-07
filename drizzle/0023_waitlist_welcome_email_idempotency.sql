-- The questionnaire-completion welcome email was being sent once per
-- "complete" POST, with no server-side check for whether it had already
-- gone out. A double-tap on the finish/skip button (no loading state on a
-- slow connection) sent the same person the welcome email multiple times.
-- This column is claimed atomically before sending, so a duplicate POST
-- can only ever result in one email — see claimWaitlistWelcomeEmail in
-- src/lib/waitlist-data.ts.
ALTER TABLE waitlist_signups
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
