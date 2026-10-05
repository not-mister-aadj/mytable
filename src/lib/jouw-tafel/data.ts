import { and, eq, gt, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import { events, waitlistSignups } from "@/db/schema";
import { isEnglishOpenForSundayTable } from "@/lib/booking-table-language";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import { JOUW_TAFEL_SEAT_PRICE_CENTS, QUIZ_CITIES, bookingOpensOverride, nextDatesPerCity, withBookingWindow, SIGNUP_COUNT_MIN, bracketFromEventName, roundSignupCount, spotsLeft, supportedCity, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { signupCountsBySubset } from "@/lib/jouw-tafel/quiz-logic";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";

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
      capacity: events.capacity,
      spotsSold: events.spotsSold,
      extras: events.extras,
      membersOnlyUntil: events.membersOnlyUntil,
    })
    .from(events)
    .where(
      and(
        eq(events.experienceType, JOUW_TAFEL_TYPE),
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, new Date()),
      ),
    );

  const out: QuizEvent[] = [];
  for (const row of rows) {
    const bracket = bracketFromEventName(row.nameNl);
    out.push({
      id: row.id,
      slug: row.slug,
      city: row.city,
      bracket,
      startsAt: row.startsAt.toISOString(),
      // The funnel's own seat price, not events.price_cents (see
      // JOUW_TAFEL_SEAT_PRICE_CENTS): cards, sheet total and info line.
      priceCents: JOUW_TAFEL_SEAT_PRICE_CENTS,
      capacity: row.capacity,
      spotsSold: row.spotsSold,
      comingSoon: Boolean(row.extras?.comingSoon),
      englishOpen: isEnglishOpenForSundayTable(row.id),
      membersOnlyUntil: row.membersOnlyUntil?.toISOString() ?? null,
      bookingOpensAt: bookingOpensOverride(row.extras),
    });
  }
  return out;
}

/** Short cache, dropped with the agenda whenever a purchase or admin edit
 * revalidates PUBLISHED_EVENTS_CACHE_TAG. */
const getCachedEvents = unstable_cache(loadEvents, ["jouw-tafel-landing-events-v2"], {
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

/**
 * Dev-only preview of the count copy. Outside production every count
 * (landing total, per city, every combination of cities) is DEV_COUNT_DEFAULT
 * instead of the nearly empty dev database, so the copy with a number shows
 * by default. `?aantal=N` on the landing page, the sign-up and log-in screens
 * and /jouw-tafel/start uses N instead; `?aantal=0` shows the copy without a
 * number. The usual rounding and the SIGNUP_COUNT_MIN threshold still apply.
 * Ignored completely when NODE_ENV is "production".
 */
const DEV_COUNT_DEFAULT = 190;

export function devCountOverride(value: string | string[] | undefined): number | null {
  if (process.env.NODE_ENV === "production") return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,7}$/.test(raw.trim())) return DEV_COUNT_DEFAULT;
  return Number(raw.trim());
}

/** The social-proof number under the hero: people from the visitor's city
 * when known and big enough, otherwise everyone. Rounded up to hundreds; null
 * when the number would be too small to say anything (under
 * SIGNUP_COUNT_MIN). */
export async function getWaitlistProof(
  city: string | null,
  override: number | null = null,
): Promise<{ count: number; city: string | null } | null> {
  try {
    const counts =
      override !== null
        ? { total: override, byCity: city ? { [city]: override } : {} }
        : await getCachedWaitlistCounts();
    const cityCount = city ? counts.byCity[city] ?? 0 : 0;
    if (city && cityCount >= SIGNUP_COUNT_MIN) return { count: roundSignupCount(cityCount), city };
    if (counts.total >= SIGNUP_COUNT_MIN) return { count: roundSignupCount(counts.total), city: null };
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
    // The booking window depends on the moment, so it is applied after the
    // cache: members from 4 weeks before, everyone 2 days later, and only
    // the next two dates of each city.
    const now = Date.now();
    const events = nextDatesPerCity(await getCachedEvents()).map((e) => withBookingWindow(e, now));
    return { events, now };
  } catch (error) {
    console.error("[jouw-tafel] loading events failed", error);
    if (process.env.NEXT_PHASE === "phase-production-build") return { events: [], now: Date.now() };
    throw error;
  }
}

/**
 * The single seat price: the price of the open tables when they all cost the
 * same, else null (copy then says "een losse plek" without a number). Never a
 * price that is not in the database.
 */
export function singleSeatCents(events: QuizEvent[], now: number): number | null {
  const prices = new Set(
    events
      .filter((e) => !e.comingSoon && spotsLeft(e) > 0 && new Date(e.startsAt).getTime() > now)
      .map((e) => e.priceCents),
  );
  return prices.size === 1 ? [...prices][0]! : null;
}

/** The same for a mail: null when the database cannot be reached. */
export async function getSingleSeatCents(): Promise<number | null> {
  try {
    const { events, now } = await getJouwTafelEvents();
    return singleSeatCents(events, now);
  } catch {
    return null;
  }
}

/** Sign-ups per city, for the quiz's "In {stad} hebben zich al N+ mensen
 * aangemeld". Rounded up to hundreds; cities under SIGNUP_COUNT_MIN are left
 * out (the quiz then only says "Je bent niet de enige"). Aggregates only. */
export async function getWaitlistCityCounts(override: number | null = null): Promise<Record<string, number>> {
  try {
    const counts =
      override !== null
        ? { byCity: Object.fromEntries(QUIZ_CITIES.map((c) => [c, override])) }
        : await getCachedWaitlistCounts();
    const out: Record<string, number> = {};
    for (const [city, n] of Object.entries(counts.byCity)) {
      if (n >= SIGNUP_COUNT_MIN) out[city] = roundSignupCount(n);
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

const getCachedSubsetCounts = unstable_cache(loadSubsetCounts, ["jouw-tafel-signup-subset-counts-v3"], {
  revalidate: 3600,
});

/** For the quiz's "stop-stad" screen with two or more cities: the combined
 * distinct count per combination of our cities, keyed by cityMask, rounded
 * up to hundreds, SIGNUP_COUNT_MIN and up only. Empty on failure (the screen
 * then shows its fallback). */
export async function getSignupSubsetCounts(override: number | null = null): Promise<Record<string, number>> {
  try {
    if (override !== null) {
      // Same rounding and threshold as the real counts, for every combination.
      const out: Record<string, number> = {};
      if (override >= SIGNUP_COUNT_MIN) {
        for (let mask = 1; mask < 1 << QUIZ_CITIES.length; mask++) out[String(mask)] = roundSignupCount(override);
      }
      return out;
    }
    return await getCachedSubsetCounts();
  } catch (error) {
    console.error("[jouw-tafel] loading signup subset counts failed", error);
    return {};
  }
}
