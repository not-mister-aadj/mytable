-- Feedback after a Sunday Social, one row per booking (the 20:00 mail's page).
CREATE TABLE IF NOT EXISTS booking_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  mood text,
  venue_mood text,
  highlight text,
  improve text,
  quote_consent boolean NOT NULL DEFAULT false,
  photo_url text,
  contact_ok boolean NOT NULL DEFAULT false,
  want_to_see jsonb NOT NULL DEFAULT '[]'::jsonb,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_feedback_event_idx ON booking_feedback (event_id);
