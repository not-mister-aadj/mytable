-- Ambassadors: students apply on /ambassadors (motivation as a file or text),
-- we plan a meeting. Only for us; info@ gets a mail for each one.
CREATE TABLE IF NOT EXISTS ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  city text NOT NULL,
  study text,
  institution text,
  study_year text,
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  instagram text,
  linkedin text,
  motivation_text text,
  motivation_path text,
  motivation_name text,
  availability text,
  heard_from text,
  locale text NOT NULL DEFAULT 'nl',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_applications_created_idx ON ambassador_applications (created_at DESC);
ALTER TABLE ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Private bucket for the motivation documents: admin opens them via signed links.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ambassador-applications',
  'ambassador-applications',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;
