-- A "Jouw tafel" Sunday Table is always bookable (guests hear the venue
-- later) and holds at most 20 for now (founder, 4 October 2026). Series
-- tables made as "Binnenkort" before this open up. Safe to run twice.

ALTER TABLE jouw_tafel_series ALTER COLUMN default_capacity SET DEFAULT 20;
UPDATE jouw_tafel_series SET default_capacity = 20, updated_at = now() WHERE default_capacity = 12;

UPDATE events
SET extras = coalesce(extras, '{}'::jsonb) - 'comingSoon',
    capacity = greatest(20, spots_sold),
    updated_at = now()
WHERE experience_type = 'jouw-tafel'
  AND series_id IS NOT NULL
  AND starts_at > now()
  AND coalesce((extras ->> 'comingSoon')::boolean, false) = true;
