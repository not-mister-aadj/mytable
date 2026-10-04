-- "Jouw tafel" Sunday Table series: one per city, a table every N weeks,
-- created automatically ahead of time (src/lib/jouw-tafel/series-server.ts,
-- daily cron /api/cron/jouw-tafel-series). Pauses apply to every city.
-- Safe to run twice.

CREATE TABLE IF NOT EXISTS jouw_tafel_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  -- The first Sunday of the series; every next table is interval_weeks later.
  first_date date NOT NULL,
  interval_weeks integer NOT NULL DEFAULT 4,
  -- Amsterdam local time, "HH:MM".
  start_time text NOT NULL DEFAULT '14:00',
  default_capacity integer NOT NULL DEFAULT 12,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jouw_tafel_series_city_unique UNIQUE (city),
  CONSTRAINT jouw_tafel_series_interval_check CHECK (interval_weeks BETWEEN 1 AND 12),
  CONSTRAINT jouw_tafel_series_capacity_check CHECK (default_capacity BETWEEN 1 AND 100),
  CONSTRAINT jouw_tafel_series_time_check CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

-- No tables in these periods (both days included), in any city. The rhythm
-- keeps running: a date that falls in a pause is skipped, not moved.
CREATE TABLE IF NOT EXISTS jouw_tafel_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jouw_tafel_pauses_range_check CHECK (ends_on >= starts_on)
);

-- Dates an admin removed from a series: never created again.
CREATE TABLE IF NOT EXISTS jouw_tafel_series_skips (
  series_id uuid NOT NULL REFERENCES jouw_tafel_series(id) ON DELETE CASCADE,
  table_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (series_id, table_date)
);

-- Which series (and which of its dates) an event was made for. The unique
-- index is the claim: two cron runs at once never create a date twice.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES jouw_tafel_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_date date;

CREATE UNIQUE INDEX IF NOT EXISTS events_series_date_unique
  ON events (series_id, series_date)
  WHERE series_id IS NOT NULL;

-- Same posture as the rest of the schema: server-only access.
ALTER TABLE jouw_tafel_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE jouw_tafel_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jouw_tafel_series_skips ENABLE ROW LEVEL SECURITY;

-- The agreed start (founder, 4 October 2026): every city every 4 weeks, two
-- cities a Sunday, neighbouring cities a week apart, from Rotterdam on
-- 1 November 2026, and a break from 20 December to 10 January.
INSERT INTO jouw_tafel_series (city, first_date) VALUES
  ('Rotterdam', '2026-11-01'),
  ('Nijmegen', '2026-11-01'),
  ('Den Haag', '2026-11-08'),
  ('Eindhoven', '2026-11-08'),
  ('Amsterdam', '2026-11-15'),
  ('Breda', '2026-11-15'),
  ('Utrecht', '2026-11-22'),
  ('Groningen', '2026-11-22')
ON CONFLICT (city) DO NOTHING;

INSERT INTO jouw_tafel_pauses (starts_on, ends_on, label)
SELECT '2026-12-20', '2027-01-10', 'Kerst en oud & nieuw'
WHERE NOT EXISTS (
  SELECT 1 FROM jouw_tafel_pauses WHERE starts_on = '2026-12-20' AND ends_on = '2027-01-10'
);
