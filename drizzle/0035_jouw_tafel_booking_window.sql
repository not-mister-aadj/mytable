-- A "Jouw tafel" Sunday Table opens for members 28 days before its date and
-- for everyone 2 days later (src/lib/jouw-tafel/logic.ts,
-- jouwTafelBookingWindow). New series tables get members_only_until when
-- they are made; this sets it on the ones made before. Safe to run twice.

UPDATE events
SET members_only_until = starts_at - interval '26 days',
    updated_at = now()
WHERE experience_type = 'jouw-tafel'
  AND members_only_until IS NULL
  AND starts_at > now();
