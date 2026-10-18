-- "Meet your table" answers on the person, so a new booking starts with them,
-- and a log of every email we send. Safe to run twice.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_conversation_style text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_ask_me_about text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_favorite_spot text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_wine text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_into_now text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_share_consent boolean NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS intro_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  email_normalized text NOT NULL,
  subject text NOT NULL,
  html text,
  resend_id text,
  source text NOT NULL DEFAULT 'app',
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS email_log_resend_id_recipient_unique
  ON email_log (resend_id, email_normalized);
CREATE INDEX IF NOT EXISTS email_log_email_sent_idx
  ON email_log (email_normalized, sent_at DESC);
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Backfill: each person's most recent answers from their bookings (only the
-- fields they filled in; the newest booking with an answer wins per field).
WITH answered AS (
  SELECT lower(trim(b.email)) AS email_normalized, b.intro_answered_at,
         b.intro_conversation_style, b.intro_ask_me_about, b.intro_favorite_spot,
         b.intro_wine, b.intro_into_now, b.intro_share_consent
  FROM bookings b
  WHERE b.payment_status = 'paid' AND b.intro_answered_at IS NOT NULL
),
latest AS (
  SELECT email_normalized,
    (array_agg(intro_conversation_style ORDER BY intro_answered_at DESC) FILTER (WHERE nullif(trim(intro_conversation_style), '') IS NOT NULL))[1] AS style,
    (array_agg(intro_ask_me_about ORDER BY intro_answered_at DESC) FILTER (WHERE nullif(trim(intro_ask_me_about), '') IS NOT NULL))[1] AS ask,
    (array_agg(intro_favorite_spot ORDER BY intro_answered_at DESC) FILTER (WHERE nullif(trim(intro_favorite_spot), '') IS NOT NULL))[1] AS spot,
    (array_agg(intro_wine ORDER BY intro_answered_at DESC) FILTER (WHERE nullif(trim(intro_wine), '') IS NOT NULL))[1] AS wine,
    (array_agg(intro_into_now ORDER BY intro_answered_at DESC) FILTER (WHERE nullif(trim(intro_into_now), '') IS NOT NULL))[1] AS into_now,
    bool_or(intro_share_consent) AS consent,
    max(intro_answered_at) AS updated_at
  FROM answered
  GROUP BY email_normalized
)
UPDATE customers c SET
  intro_conversation_style = coalesce(c.intro_conversation_style, l.style),
  intro_ask_me_about = coalesce(c.intro_ask_me_about, l.ask),
  intro_favorite_spot = coalesce(c.intro_favorite_spot, l.spot),
  intro_wine = coalesce(c.intro_wine, l.wine),
  intro_into_now = coalesce(c.intro_into_now, l.into_now),
  intro_share_consent = c.intro_share_consent OR coalesce(l.consent, false),
  intro_updated_at = greatest(c.intro_updated_at, l.updated_at)
FROM latest l
WHERE c.email_normalized = l.email_normalized;

-- Upcoming bookings without answers start with what the guest told us before.
UPDATE bookings b SET
  intro_conversation_style = c.intro_conversation_style,
  intro_ask_me_about = c.intro_ask_me_about,
  intro_favorite_spot = c.intro_favorite_spot,
  intro_wine = c.intro_wine,
  intro_into_now = c.intro_into_now,
  intro_share_consent = c.intro_share_consent,
  intro_answered_at = c.intro_updated_at
FROM customers c, events e
WHERE c.email_normalized = lower(trim(b.email))
  AND e.id = b.event_id
  AND e.starts_at > now()
  AND b.payment_status = 'paid'
  AND b.lifecycle_status = 'active'
  AND b.intro_answered_at IS NULL
  AND c.intro_updated_at IS NOT NULL;
