-- Something that wasn't okay at a Sunday Social, reported from the link in
-- the 20:00 feedback mail. Only for us; info@ gets a mail for each one.
CREATE TABLE IF NOT EXISTS feedback_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  about jsonb NOT NULL DEFAULT '[]'::jsonb,
  about_other boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  contact_ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_reports_event_idx ON feedback_reports (event_id, created_at DESC);
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;
