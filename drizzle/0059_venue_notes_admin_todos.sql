-- Admin notes on what was agreed with a bar, per Sunday when it is about one.
CREATE TABLE IF NOT EXISTS venue_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (venue_id IS NOT NULL OR event_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS venue_notes_venue_idx ON venue_notes (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS venue_notes_event_idx ON venue_notes (event_id, created_at DESC);
ALTER TABLE venue_notes ENABLE ROW LEVEL SECURITY;

-- "Te doen" items on the admin's Vandaag page: when each first came up, and
-- whether it was clicked away. The detail is kept so a clicked-away item
-- comes back as soon as it says something new.
CREATE TABLE IF NOT EXISTS admin_todos (
  key text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  dismissed_detail text,
  dismissed_at timestamptz
);
ALTER TABLE admin_todos ENABLE ROW LEVEL SECURITY;
