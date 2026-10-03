import { and, eq, gt, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import { events, waitlistSignups } from "@/db/schema";
import { isEnglishOpenForSundayTable } from "@/lib/booking-table-language";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import { SIGNUP_COUNT_MIN, bracketFromEventName, supportedCity, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { signupCountsBySubset } from "@/lib/jouw-tafel/quiz-logic";

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

/** Sign-ups: everyone, and per city (our cities under their usual name,
 * any spelling; other places as stored). Distinct emails. Emails are only
 * read here; just the counts leave the server. */
async function loadWaitlistCounts(): Promise<{ total: number; byCity: Record<string, number> }> {
  if (!isDbConfigured()) return { total: 0, byCity: {} };
  const rows = await signupRows();
  const all = new Set<string>();
  const perCity = new Map<string, Set<string>>();
  for (const row of rows) {
    all.add(row.email);
    const city = supportedCity(row.city) ?? row.city;
    if (!perCity.has(city)) perCity.set(city, new Set());
    perCity.get(city)!.add(row.email);
  }
  const byCity: Record<string, number> = {};
  for (const [city, emails] of perCity) byCity[city] = emails.size;
  return { total: all.size, byCity };
}

/** One row per email and city, emails lowercased. */
async function signupRows(): Promise<{ email: string; city: string }[]> {
  return getDb()
    .selectDistinct({ email: sql<string>`lower(${waitlistSignups.email})`, city: waitlistSignups.city })
    .from(waitlistSignups);
}

const getCachedWaitlistCounts = unstable_cache(loadWaitlistCounts, ["jouw-tafel-waitlist-counts-v2"], {
  revalidate: 3600,
});

/** The social-proof number under the hero: people from the visitor's city
 * when known and big enough, otherwise everyone. Rounded down to tens; null
 * when the number would be too small to say anything (under
 * SIGNUP_COUNT_MIN). */
export async function getWaitlistProof(
  city: string | null,
): Promise<{ count: number; city: string | null } | null> {
  try {
    const counts = await getCachedWaitlistCounts();
    const floorTens = (n: number) => Math.floor(n / 10) * 10;
    const cityCount = city ? counts.byCity[city] ?? 0 : 0;
    if (city && cityCount >= SIGNUP_COUNT_MIN) return { count: floorTens(cityCount), city };
    if (counts.total >= SIGNUP_COUNT_MIN) return { count: floorTens(counts.total), city: null };
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

/** Sign-ups per city, for the quiz's "In {stad} hebben zich al N+ mensen
 * aangemeld". Rounded down to tens; cities under SIGNUP_COUNT_MIN are left
 * out (the quiz then only says "Je bent niet de enige"). Aggregates only. */
export async function getWaitlistCityCounts(): Promise<Record<string, number>> {
  try {
    const counts = await getCachedWaitlistCounts();
    const out: Record<string, number> = {};
    for (const [city, n] of Object.entries(counts.byCity)) {
      if (n >= SIGNUP_COUNT_MIN) out[city] = Math.floor(n / 10) * 10;
    }
    return out;
  } catch (error) {
    console.error("[jouw-tafel] loading waitlist city counts failed", error);
    return {};
  }
}

/** Distinct sign-ups for every combination of our cities (see
 * signupCountsBySubset). Emails are only read here; just the counts leave. */
async function loadSubsetCounts(): Promise<Record<string, number>> {
  if (!isDbConfigured()) return {};
  return signupCountsBySubset(await signupRows());
}

const getCachedSubsetCounts = unstable_cache(loadSubsetCounts, ["jouw-tafel-signup-subset-counts-v2"], {
  revalidate: 3600,
});

/** For the quiz's "stop-stad" screen with two or more cities: the combined
 * distinct count per combination of our cities, keyed by cityMask, rounded
 * down to tens, SIGNUP_COUNT_MIN and up only. Empty on failure (the screen
 * then shows its fallback). */
export async function getSignupSubsetCounts(): Promise<Record<string, number>> {
  try {
    return await getCachedSubsetCounts();
  } catch (error) {
    console.error("[jouw-tafel] loading signup subset counts failed", error);
    return {};
  }
}
