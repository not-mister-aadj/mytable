-- Clubmember: track which billing period already received a 7-day renewal reminder

ALTER TABLE club_memberships
  ADD COLUMN IF NOT EXISTS renewal_reminder_period_end timestamptz;
