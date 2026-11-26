import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";

/** Below this many answers the line is left out: too few to say anything. */
const MIN_ANSWERS = 10;

/**
 * "25 van 28 gasten vonden het top of goed": from the feedback guests filled
 * in after a Sunday Social (mood great or good, out of all finished
 * answers). Real numbers only; null when there are too few or the database
 * is not there.
 */
export async function getFeedbackProof(): Promise<{ good: number; total: number } | null> {
  if (!isDbConfigured()) return null;
  try {
    const [row] = (await getDb().execute(sql`
      select count(*) filter (where f.mood in ('great', 'good'))::int as good, count(*)::int as total
      from booking_feedback f
      join events e on e.id = f.event_id
      where f.completed_at is not null and f.mood is not null
        and e.experience_type in ('jouw-tafel', 'sunday-table')`)) as unknown as Array<{ good: number; total: number }>;
    if (!row || row.total < MIN_ANSWERS) return null;
    return { good: Number(row.good), total: Number(row.total) };
  } catch (error) {
    console.error("[feedback-proof] failed", error);
    return null;
  }
}

export function feedbackProofLabel(proof: { good: number; total: number } | null, locale: "nl" | "en"): string | null {
  if (!proof) return null;
  return locale === "en"
    ? `${proof.good} of ${proof.total} guests rated it great or good`
    : `${proof.good} van ${proof.total} gasten vonden het top of goed`;
}
