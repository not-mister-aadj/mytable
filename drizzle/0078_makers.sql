-- Makers: people who photograph food and places apply on /makers. Once
-- approved they get a link (?via=CODE). Someone new who books through it
-- brings a friend free the first time; the maker earns a fixed amount per
-- paid seat and per paid membership month for two years.
CREATE TABLE IF NOT EXISTS makers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  instagram text,
  tiktok text,
  city text NOT NULL,
  work_style text NOT NULL DEFAULT 'either',
  portfolio_url text,
  note text,
  locale text NOT NULL DEFAULT 'nl',
  status text NOT NULL DEFAULT 'new',
  code text UNIQUE,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS makers_created_idx ON makers (created_at DESC);
ALTER TABLE makers ENABLE ROW LEVEL SECURITY;

-- Who came through which maker: one row per new customer (first link wins).
CREATE TABLE IF NOT EXISTS maker_referrals (
  email_normalized text PRIMARY KEY,
  maker_id uuid NOT NULL REFERENCES makers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  first_paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS maker_referrals_maker_idx ON maker_referrals (maker_id);
ALTER TABLE maker_referrals ENABLE ROW LEVEL SECURITY;

-- What a maker earned: a paid booking or a paid membership invoice.
CREATE TABLE IF NOT EXISTS maker_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id uuid NOT NULL REFERENCES makers(id),
  email_normalized text NOT NULL,
  booking_id uuid UNIQUE REFERENCES bookings(id),
  stripe_invoice_id text UNIQUE,
  seats integer NOT NULL DEFAULT 1,
  amount_cents integer NOT NULL,
  event_starts_at timestamptz,
  paid_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS maker_commissions_maker_idx ON maker_commissions (maker_id, created_at DESC);
ALTER TABLE maker_commissions ENABLE ROW LEVEL SECURITY;
