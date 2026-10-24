-- Our picks per venue (wines and a bite to share), shown on the guests' table page.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS picks jsonb NOT NULL DEFAULT '[]'::jsonb;
