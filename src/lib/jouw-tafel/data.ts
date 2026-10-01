import { and, eq, gt, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import { bookings, events, waitlistSignups } from "@/db/schema";
import { sundayTableLpSlugFromCity } from "@/data/sunday-table-lp-cities";
import { isEnglishOpenForSundayTable } from "@/lib/booking-table-language";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import { getUpcomingSundayTableLocations } from "@/lib/sunday-table-locations";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { cityMatchKey } from "@/lib/waitlist-city";
import {
  bracketFromEventName,
  QUIZ_WHYS,
  type QuizData,
  type QuizEvent,
  type QuizStats,
  type QuizWhy,
} from "@/lib/jouw-tafel/logic";

/** Venue rows that mean "not announced yet". */
const PLACEHOLDER_VENUES = new Set(["locatie volgt", "location tbd"]);

const EMPTY_STATS: QuizStats = {
  cityCounts: {},
  why: {
    base: 0,
    counts: Object.fromEntries(QUIZ_WHYS.map((id) => [id, 0])) as Record<QuizWhy, number>,
  },
  seats: { total: 0, single: 0 },
};

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
      endsAt: events.endsAt,
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

  // One query for every venue, instead of one per table.
  const locations = new Map(
    (await getUpcomingSundayTableLocations())
      .filter((l) => l.tableType === "mixed")
      .map((l) => [`${l.city}|${l.tableDate}`, l]),
  );

  const out: QuizEvent[] = [];
  for (const row of rows) {
    const bracket = bracketFromEventName(row.nameNl);
    if (!bracket) continue;
    const dateIso = amsterdamDateIso(row.startsAt);
    const citySlug = sundayTableLpSlugFromCity(row.city);
    // The date page (/sunday-table/[city]/[date]) reads its venue from this
    // table and 404s without a row, so only link to it when one exists.
    const location = citySlug ? (locations.get(`${row.city}|${dateIso}`) ?? null) : null;
    const venue = location?.venueName.trim() ?? "";
    out.push({
      id: row.id,
      slug: row.slug,
      city: row.city,
      bracket,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      priceCents: row.priceCents,
      capacity: row.capacity,
      spotsSold: row.spotsSold,
      comingSoon: Boolean(row.extras?.comingSoon),
      venueName: venue && !PLACEHOLDER_VENUES.has(venue.toLowerCase()) ? venue : null,
      citySlug: location ? citySlug : null,
      dateIso,
      englishOpen: isEnglishOpenForSundayTable(row.id),
    });
  }
  return out;
}

async function loadStats(): Promise<QuizStats> {
  if (!isDbConfigured()) return EMPTY_STATS;
  const db = getDb();

  const cityRows = await db
    .select({
      city: waitlistSignups.city,
      count: sql<number>`count(distinct ${waitlistSignups.email})::int`,
    })
    .from(waitlistSignups)
    .groupBy(waitlistSignups.city);
  const cityCounts: Record<string, number> = {};
  for (const row of cityRows) {
    const key = cityMatchKey(row.city);
    if (!key) continue;
    cityCounts[key] = (cityCounts[key] ?? 0) + Number(row.count);
  }

  // One answer set per person (their latest), among people who answered
  // the "why" question at all.
  const whyRows = await db.execute<{ value: string; n: number; base: number }>(sql`
    with latest as (
      select distinct on (email) email, preferences
      from ${waitlistSignups}
      where jsonb_typeof(preferences->'why') = 'array'
        and jsonb_array_length(preferences->'why') > 0
      order by email, created_at desc
    )
    select value, count(*)::int as n, (select count(*)::int from latest) as base
    from latest, jsonb_array_elements_text(latest.preferences->'why') as value
    group by value
  `);
  const whyCounts = { ...EMPTY_STATS.why.counts };
  let whyBase = 0;
  for (const row of whyRows as unknown as Array<{ value: string; n: number; base: number }>) {
    whyBase = Number(row.base);
    if ((QUIZ_WHYS as string[]).includes(row.value)) {
      whyCounts[row.value as QuizWhy] = Number(row.n);
    }
  }

  const [seatRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.seats}), 0)::int`,
      single: sql<number>`coalesce(sum(${bookings.seats}) filter (where ${bookings.seats} = 1), 0)::int`,
    })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
      ),
    );

  return {
    cityCounts,
    why: { base: whyBase, counts: whyCounts },
    seats: {
      total: Number(seatRow?.total ?? 0),
      single: Number(seatRow?.single ?? 0),
    },
  };
}

/** Upcoming tables: short cache, and dropped with the agenda whenever a
 * purchase or admin edit revalidates PUBLISHED_EVENTS_CACHE_TAG. */
const getCachedEvents = unstable_cache(loadEvents, ["jouw-tafel-events"], {
  revalidate: 300,
  tags: [PUBLISHED_EVENTS_CACHE_TAG],
});

/** List statistics move slowly: an hour is plenty. */
const getCachedStats = unstable_cache(loadStats, ["jouw-tafel-stats"], {
  revalidate: 3600,
});

export async function getJouwTafelData(): Promise<QuizData> {
  const [eventsResult, statsResult] = await Promise.allSettled([
    getCachedEvents(),
    getCachedStats(),
  ]);
  if (eventsResult.status === "rejected") {
    console.error("[jouw-tafel] loading events failed", eventsResult.reason);
    // Without the table list every visitor would be told there is no table
    // in their city. Outside the build, fail the render instead: ISR then
    // keeps serving the last good version of the page.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      throw eventsResult.reason;
    }
  }
  if (statsResult.status === "rejected") {
    console.error("[jouw-tafel] loading stats failed", statsResult.reason);
  }
  return {
    events: eventsResult.status === "fulfilled" ? eventsResult.value : [],
    stats: statsResult.status === "fulfilled" ? statsResult.value : EMPTY_STATS,
  };
}
