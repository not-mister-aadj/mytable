-- Groups at a "Jouw tafel" Sunday Table: an event has one or more venues
-- (event_venues, drizzle/0030), each venue one or more groups, and every
-- booking sits in one group (a 2-seat booking stays together). The founder
-- assigns by hand in admin and then marks the event "definitief".
-- Safe to run twice.

CREATE TABLE IF NOT EXISTS event_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  -- "Juni, groep 2": numbered per venue within the event.
  number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_groups_number_unique UNIQUE (event_id, venue_id, number),
  CONSTRAINT event_groups_number_check CHECK (number >= 1)
);

CREATE INDEX IF NOT EXISTS event_groups_event_idx ON event_groups (event_id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES event_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_group_idx ON bookings (group_id) WHERE group_id IS NOT NULL;

-- When the groups of an event were made final (null = still a draft).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS groups_final_at timestamptz;

-- Same posture as the rest of the schema: server-only access.
ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;
