DO $$ BEGIN
  CREATE TYPE "booking_lifecycle_status" AS ENUM('active', 'transferred', 'removed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "lifecycle_status" "booking_lifecycle_status" DEFAULT 'active' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transferred_to_event_id" uuid REFERENCES "events"("id");
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transferred_to_booking_id" uuid REFERENCES "bookings"("id");
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transferred_from_booking_id" uuid REFERENCES "bookings"("id");
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transferred_at" timestamptz;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transferred_by" text;

CREATE INDEX IF NOT EXISTS "bookings_lifecycle_status_idx" ON "bookings" ("lifecycle_status");
CREATE INDEX IF NOT EXISTS "bookings_event_lifecycle_idx" ON "bookings" ("event_id", "lifecycle_status");
