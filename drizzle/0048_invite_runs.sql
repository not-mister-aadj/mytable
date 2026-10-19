-- Invites: postponed sends ("later") and a log of every plan/send round.
ALTER TABLE invite_sends ADD COLUMN IF NOT EXISTS postponed_at timestamptz;

CREATE TABLE IF NOT EXISTS invite_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- "plan" | "send"
  kind text NOT NULL,
  dry_run boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  planned integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  error text,
  -- per mail: [{ email, status, reason }]
  details jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS invite_runs_started_idx ON invite_runs (started_at DESC);
ALTER TABLE invite_runs ENABLE ROW LEVEL SECURITY;
