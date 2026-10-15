-- "Aan tafel met": asked when booking a Sunday Social, so the tables can be
-- set by age. "similar" (people around my age) or "any" (all ages fine).
-- Null for older bookings. Safe to run twice.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS age_preference text;
