-- One row per paid membership invoice (Stripe invoice.paid), for revenue.
CREATE TABLE IF NOT EXISTS membership_payments (
  stripe_invoice_id text PRIMARY KEY,
  stripe_subscription_id text NOT NULL,
  email text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  paid_at timestamptz NOT NULL,
  period_start timestamptz,
  period_end timestamptz,
  source text NOT NULL DEFAULT 'stripe',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS membership_payments_paid_at_idx ON membership_payments (paid_at);
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
