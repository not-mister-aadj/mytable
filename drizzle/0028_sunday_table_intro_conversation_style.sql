-- "Meet your table": whether a guest is more of a talker or a listener at the
-- table ('talker' | 'listener' | 'both'), used to balance the seating so no
-- table ends up with only talkers or only listeners.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS intro_conversation_style text;
