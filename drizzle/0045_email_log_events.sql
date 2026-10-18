-- Delivery, open, click, bounce and spam events per logged email (Resend webhook).
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS last_event text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS first_opened_at timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS last_opened_at timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS first_clicked_at timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS bounced_at timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS complained_at timestamptz;
CREATE INDEX IF NOT EXISTS email_log_resend_id_idx ON email_log (resend_id);
