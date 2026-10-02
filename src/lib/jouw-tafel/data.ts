import { and, eq, gt, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import { events, waitlistSignups } from "@/db/schema";
import { isEnglishOpenForSundayTable } from "@/lib/booking-table-language";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import { bracketFromEventName, type QuizEvent } from "@/lib/jouw-tafel/logic";

/** Published, upcoming Sunday Tables. Deliberately no venue: the page never
 * names one, because the wine bar is booked once the tables are known. */
async function loadEvents(): Promise<QuizEvent[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      city: events.city,
      nameNl: events.nameNl,
      startsAt: events.startsAt,
      priceCents: events.priceCents,
      capacity: events.capacity,
      spotsSold: events.spotsSold,
      extras: events.extras,
    })
    .from(events)
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, new Date()),
      ),
    );

  const out: QuizEvent[] = [];
  for (const row of rows) {
    const bracket = bracketFromEventName(row.nameNl);
    if (!bracket) continue;
    out.push({
      id: row.id,
      slug: row.slug,
      city: row.city,
      bracket,
      startsAt: row.startsAt.toISOString(),
      priceCents: row.priceCents,
      capacity: row.capacity,
      spotsSold: row.spotsSold,
      comingSoon: Boolean(row.extras?.comingSoon),
      englishOpen: isEnglishOpenForSundayTable(row.id),
    });
  }
  return out;
}

/** Short cache, dropped with the agenda whenever a purchase or admin edit
 * revalidates PUBLISHED_EVENTS_CACHE_TAG. */
const getCachedEvents = unstable_cache(loadEvents, ["jouw-tafel-landing-events"], {
  revalidate: 300,
  tags: [PUBLISHED_EVENTS_CACHE_TAG],
});

/** People on the waitlist: everyone (distinct emails) and per city (one row
 * per email and city). Only aggregates leave the server. */
async function loadWaitlistCounts(): Promise<{ total: number; byCity: Record<string, number> }> {
  if (!isDbConfigured()) return { total: 0, byCity: {} };
  const db = getDb();
  const [totalRow] = await db
    .select({ n: sql<number>`count(distinct lower(${waitlistSignups.email}))::int` })
    .from(waitlistSignups);
  const cityRows = await db
    .select({ city: waitlistSignups.city, n: sql<number>`count(*)::int` })
    .from(waitlistSignups)
    .groupBy(waitlistSignups.city);
  const byCity: Record<string, number> = {};
  for (const row of cityRows) if (row.city) byCity[row.city] = row.n;
  return { total: totalRow?.n ?? 0, byCity };
}

const getCachedWaitlistCounts = unstable_cache(loadWaitlistCounts, ["jouw-tafel-waitlist-counts"], {
  revalidate: 3600,
});

/** The social-proof number under the hero: people from the visitor's city
 * when known and big enough, otherwise everyone. Rounded down to tens; null
 * when the number would be too small to say anything (under 20). */
export async function getWaitlistProof(
  city: string | null,
): Promise<{ count: number; city: string | null } | null> {
  try {
    const counts = await getCachedWaitlistCounts();
    const floorTens = (n: number) => Math.floor(n / 10) * 10;
    const cityCount = city ? counts.byCity[city] ?? 0 : 0;
    if (city && cityCount >= 20) return { count: floorTens(cityCount), city };
    if (counts.total >= 20) return { count: floorTens(counts.total), city: null };
    return null;
  } catch (error) {
    console.error("[jouw-tafel] loading waitlist counts failed", error);
    return null;
  }
}

/** Upcoming Sunday Tables for the landing page, with the moment they are
 * judged against (passed to the client, so both render the same list).
 * Throws when the database is unreachable: an error page is better than
 * "no tables" when there are. */
export async function getJouwTafelEvents(): Promise<{ events: QuizEvent[]; now: number }> {
  try {
    return { events: await getCachedEvents(), now: Date.now() };
  } catch (error) {
    console.error("[jouw-tafel] loading events failed", error);
    if (process.env.NEXT_PHASE === "phase-production-build") return { events: [], now: Date.now() };
    throw error;
  }
}

/** People on the waitlist per city, for the quiz's "In {stad} staan al N+
 * mensen op de lijst". Rounded down to tens; cities under 20 are left out
 * (the quiz then says "Je bent niet de enige"). Aggregates only. */
export async function getWaitlistCityCounts(): Promise<Record<string, number>> {
  try {
    const counts = await getCachedWaitlistCounts();
    const out: Record<string, number> = {};
    for (const [city, n] of Object.entries(counts.byCity)) {
      if (n >= 20) out[city] = Math.floor(n / 10) * 10;
    }
    return out;
  } catch (error) {
    console.error("[jouw-tafel] loading waitlist city counts failed", error);
    return {};
  }
}
