-- What was sent, apart from the mail itself: which mail (template), which
-- variant when more than one runs, which release of the code built it, and the
-- values filled in for this guest. Enough to tell variants apart and to build
-- the mail again once its stored body is gone.
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS template text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS variant text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS version text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS vars jsonb;
CREATE INDEX IF NOT EXISTS email_log_template_idx ON email_log (template, variant);
