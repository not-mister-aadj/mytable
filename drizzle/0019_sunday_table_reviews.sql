-- Sunday Table: day-1 review emails + review submissions

ALTER TABLE sunday_table_signups
  ADD COLUMN IF NOT EXISTS review_email_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS sunday_table_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id uuid NOT NULL REFERENCES sunday_table_signups(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  body text,
  photo_url text,
  marketing_consent boolean NOT NULL DEFAULT false,
  locale text NOT NULL DEFAULT 'nl',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sunday_table_reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS sunday_table_reviews_signup_unique
  ON sunday_table_reviews (signup_id);
