import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { waitlistSignups } from "@/db/schema";

export type SundayTableMotivationStats = {
  meetNewPeople: number;
  solo: number;
  discoverPlaces: number;
  justForFun: number;
};

/** Last known real numbers, shown only if the DB is unreachable, never a
 * made-up starting point. */
const FALLBACK_STATS: SundayTableMotivationStats = {
  meetNewPeople: 65,
  solo: 61,
  discoverPlaces: 58,
  justForFun: 53,
};

/**
 * Percentage of waitlist signups whose questionnaire answers match each
 * claim on the reveal page's "why people come to MyTable" stat row.
 * Computed from real preferences (the "who do you come with" and "why are
 * you on the list" questions), not a fixed one-off snapshot.
 */
export async function getSundayTableMotivationStats(): Promise<SundayTableMotivationStats> {
  if (!isDbConfigured()) return FALLBACK_STATS;

  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      meetNewPeople: sql<number>`count(*) filter (where ${waitlistSignups.preferences}->'company' @> '["meet_new"]')::int`,
      solo: sql<number>`count(*) filter (where ${waitlistSignups.preferences}->'company' @> '["solo"]')::int`,
      discoverPlaces: sql<number>`count(*) filter (where ${waitlistSignups.preferences}->'why' @> '["discover_places"]')::int`,
      justForFun: sql<number>`count(*) filter (where ${waitlistSignups.preferences}->'why' @> '["just_fun"]')::int`,
    })
    .from(waitlistSignups);

  if (!row || row.total === 0) return FALLBACK_STATS;

  const percentage = (count: number) => Math.round((count / row.total) * 100);
  return {
    meetNewPeople: percentage(row.meetNewPeople),
    solo: percentage(row.solo),
    discoverPlaces: percentage(row.discoverPlaces),
    justForFun: percentage(row.justForFun),
  };
}
