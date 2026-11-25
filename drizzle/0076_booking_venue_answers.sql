-- Questions a venue asks our guests before a Sunday (diet, staying for live
-- music), per booking. The diet also lands in dietary_notes.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS venue_answers jsonb;
