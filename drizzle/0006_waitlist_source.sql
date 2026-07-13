ALTER TABLE "waitlist_signups" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'waitlist';

CREATE INDEX IF NOT EXISTS "waitlist_signups_source_created_at_idx"
  ON "waitlist_signups" ("source", "created_at" DESC);
