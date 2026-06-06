ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" timestamptz;
