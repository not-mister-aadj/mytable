-- Feedback: what a guest spent at the venue, as a range per person (without the ticket).
ALTER TABLE booking_feedback ADD COLUMN IF NOT EXISTS spend_range text;
