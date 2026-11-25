-- People who deleted their account. Only a sha256 of the normalized email and
-- the moment: the nightly account job and the invites skip every signup or
-- booking from before that moment, so a deleted account is not made again
-- from the bookings we must keep. A signup after it counts as a new start.
CREATE TABLE IF NOT EXISTS deleted_accounts (
  email_hash text PRIMARY KEY,
  deleted_at timestamptz NOT NULL DEFAULT now()
);
-- Only the site (service role) reads and writes it.
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;
