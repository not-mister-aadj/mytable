-- One or two sentences that introduce the bar in the location mail, written
-- by us; empty = the mail uses the opening of the description.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS mail_intro_nl text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS mail_intro_en text;
