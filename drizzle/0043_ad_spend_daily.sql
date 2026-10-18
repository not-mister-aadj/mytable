-- Meta ad spend per campaign per day, for the Board page (cost per ticket,
-- ROAS, cost per channel). Filled from Meta by hand ("update financien").
-- Safe to run twice.
CREATE TABLE IF NOT EXISTS ad_spend_daily (
  day date NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  spend_cents integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, campaign_id)
);
ALTER TABLE ad_spend_daily ENABLE ROW LEVEL SECURITY;
