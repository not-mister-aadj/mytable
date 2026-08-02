import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { sundayTableReviews, sundayTableSignups } from "@/db/schema";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { verifySundayTableReviewToken } from "@/lib/sunday-table-review-token";

export type ReviewAccess =
  | {
      ok: true;
      signup: typeof sundayTableSignups.$inferSelect;
      existing: typeof sundayTableReviews.$inferSelect | null;
    }
  | { ok: false; reason: "invalid_token" | "not_found" | "not_eligible" | "db" };

/** Confirmed past Sunday Table signup matching a review token. */
export async function resolveSundayTableReviewAccess(
  token: string,
): Promise<ReviewAccess> {
  if (!isDbConfigured()) return { ok: false, reason: "db" };

  const payload = await verifySundayTableReviewToken(token);
  if (!payload) return { ok: false, reason: "invalid_token" };

  const db = getDb();
  const [signup] = await db
    .select()
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.id, payload.signupId),
        eq(sundayTableSignups.email, payload.email),
      ),
    )
    .limit(1);

  if (!signup) return { ok: false, reason: "not_found" };
  if (signup.status !== "confirmed") {
    return { ok: false, reason: "not_eligible" };
  }

  const today = amsterdamDateIso(new Date());
  const eventPassed = signup.tableDate < today || Boolean(signup.attendedAt);
  if (!eventPassed) return { ok: false, reason: "not_eligible" };

  const [existing] = await db
    .select()
    .from(sundayTableReviews)
    .where(eq(sundayTableReviews.signupId, signup.id))
    .limit(1);

  return { ok: true, signup, existing: existing ?? null };
}
