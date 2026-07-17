CREATE TABLE IF NOT EXISTS event_slug_redirects (
  from_slug text PRIMARY KEY,
  to_slug text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_slug_redirects_to_slug_idx
  ON event_slug_redirects (to_slug);

CREATE INDEX IF NOT EXISTS event_slug_redirects_event_id_idx
  ON event_slug_redirects (event_id);
