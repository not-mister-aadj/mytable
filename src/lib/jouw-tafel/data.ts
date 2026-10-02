import { and, eq, gt } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";
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
