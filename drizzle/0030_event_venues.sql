-- Which venue(s) an event took place at, so admin can show per venue who has
-- been there and per customer where they have been. An event can have
-- several venues (a wine walk has several stops), in order via position.
-- Kept in sync by the admin event editor and the Sunday Table location form.
-- Safe to run twice.

CREATE TABLE IF NOT EXISTS event_venues (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  -- Restrict: a venue with visit history should not silently disappear.
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, venue_id)
);

CREATE INDEX IF NOT EXISTS event_venues_venue_id_idx
  ON event_venues (venue_id);

-- Same posture as the rest of the schema: the app connects as the owner via
-- DATABASE_URL, anon/authenticated get no direct access at all.
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- Juni hosts the Rotterdam Sunday Tables but only existed as free text on
-- sunday_table_locations. Same about text as the public Sunday Table page.
INSERT INTO venues (name, city, area, address, description_nl, description_en)
SELECT
  'Juni',
  'Rotterdam',
  'Kralingen',
  'Oostzeedijk 340A, 3063 CC Rotterdam',
  'Juni is de eerste wijn- en kaasbar van Rotterdam, opgezet door Puck en Nienke, die elkaar leerden kennen bij restaurant OX. In de kaasvitrine liggen vooral Nederlandse kazen van kleine makers, met wijnen uit Frankrijk, Italië en Spanje ernaast. Een kleine, warme zaak met zo''n 25 plekken.',
  'Juni is Rotterdam''s first wine and cheese bar, started by Puck and Nienke, who met working at restaurant OX. The cheese counter is full of Dutch cheeses from small makers, next to wines from France, Italy and Spain. A small, warm place with around 25 seats.'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Juni');

-- Backfill 1: the legacy single venue column.
INSERT INTO event_venues (event_id, venue_id, position)
SELECT e.id, e.venue_id, 0
FROM events e
JOIN venues v ON v.id = e.venue_id
ON CONFLICT DO NOTHING;

-- Backfill 2: the ordered stops in extras.venueIds. Only ids that are real
-- venues; the "mytable:location-tbd" placeholder and stale ids drop out
-- because they match no row (compared as text, so nothing is cast).
INSERT INTO event_venues (event_id, venue_id, position)
SELECT e.id, v.id, (s.ord - 1)::integer
FROM events e
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN jsonb_typeof(e.extras -> 'venueIds') = 'array' THEN e.extras -> 'venueIds'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS s(venue_id, ord)
JOIN venues v ON v.id::text = lower(trim(s.venue_id))
ON CONFLICT DO NOTHING;

-- Backfill 3: the two Rotterdam Sunday Table ticket events at Juni. Also
-- matched through slug redirects in case a slug changed after this was written.
INSERT INTO event_venues (event_id, venue_id, position)
SELECT e.id, j.id, 0
FROM events e
CROSS JOIN (
  SELECT id FROM venues WHERE name = 'Juni' ORDER BY created_at LIMIT 1
) j
WHERE e.slug IN (
    'sunday-table-rotterdam-bar-juni-25-oktober-2026',
    'sunday-table-rotterdam-bar-juni-1-november-2026'
  )
  OR e.id IN (
    SELECT r.event_id FROM event_slug_redirects r
    WHERE r.from_slug IN (
      'sunday-table-rotterdam-bar-juni-25-oktober-2026',
      'sunday-table-rotterdam-bar-juni-1-november-2026'
    )
  )
ON CONFLICT DO NOTHING;

-- Backfill 4: the Rotterdam wine tastings held at Proef bij Platenburg
-- (confirmed by the founder). The other cities' tastings stay unlinked.
INSERT INTO event_venues (event_id, venue_id, position)
SELECT e.id, p.id, 0
FROM events e
JOIN venues p ON p.id = '9b801de8-b14b-4cfc-9199-779337f1b023'
WHERE e.slug IN (
    'wijnspijs-proeverij-rotterdam-21-jun-2026',
    'wijnspijs-proeferij-rotterdam-28-jun-2026',
    'wijnspijs-proeverij-rotterdam-26-jul-2026'
  )
  OR e.id IN (
    SELECT r.event_id FROM event_slug_redirects r
    WHERE r.from_slug IN (
      'wijnspijs-proeverij-rotterdam-21-jun-2026',
      'wijnspijs-proeferij-rotterdam-28-jun-2026',
      'wijnspijs-proeverij-rotterdam-26-jul-2026'
    )
  )
ON CONFLICT DO NOTHING;
