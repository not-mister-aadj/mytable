-- Referral system was unused (0 rows ever) and had no admin UI, duplicate
-- of the affiliate system. Removed the code (src/lib/referral.ts,
-- /api/referral/attribute) and now dropping the tables.
DROP TABLE IF EXISTS referral_attributions;
DROP TABLE IF EXISTS referral_codes;
