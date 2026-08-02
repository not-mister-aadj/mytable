-- Align DB plan_id check with sold plans (1m / 5m / 12m).
-- Keep legacy 3m / 6m so existing memberships remain valid.
ALTER TABLE "club_memberships" DROP CONSTRAINT IF EXISTS "club_memberships_plan_check";
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_plan_check"
  CHECK ("plan_id" IN ('1m', '3m', '5m', '6m', '12m'));
