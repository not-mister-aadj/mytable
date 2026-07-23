CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (key, value)
VALUES (
  'waitlist_whatsapp',
  '{
    "wine_tasting": "",
    "chefs_special": "",
    "wine_walk": "",
    "aperitivo": ""
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
