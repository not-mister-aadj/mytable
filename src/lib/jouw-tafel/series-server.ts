import { and, asc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import {
  bookings,
  eventVenues,
  events,
  jouwTafelPauses,
  jouwTafelSeries,
  jouwTafelSeriesSkips,
  venues,
  type JouwTafelPause,
  type JouwTafelSeries,
} from "@/db/schema";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { parseEventDateTimeLocal } from "@/lib/event-datetime-local";
import { generateEventSlug } from "@/lib/event-slug";
import { resolveUniqueEventSlug } from "@/lib/event-slug.server";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import { DEFAULT_EVENT_IMAGE } from "@/lib/image-settings";
import { JOUW_TAFEL_SEAT_PRICE_CENTS } from "@/lib/jouw-tafel/logic";
import { SERIES_WARN_DAYS, addDays, seriesDates, seriesWindow } from "@/lib/jouw-tafel/series-logic";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";

/** How long a series table lasts, for its end time. */
const TABLE_HOURS = 3;

export function amsterdamToday(now = new Date()): string {
  return amsterdamDateIso(now);
}

/** A series date at its start time, as an instant (Amsterdam wall clock). */
export function seriesStartsAt(date: string, startTime: string): Date {
  return parseEventDateTimeLocal(`${date}T${startTime}`);
}

async function loadPauses(): Promise<JouwTafelPause[]> {
  return getDb().select().from(jouwTafelPauses).orderBy(asc(jouwTafelPauses.startsOn));
}

/**
 * Creates every missing table of every active series from today up to the
 * horizon (SERIES_HORIZON_DAYS), published and bookable straight away (a
 * Sunday Table never waits for a venue: guests hear it later). Never
 * touches a table that exists, and never brings back a date an admin
 * removed. Safe to run twice at once (unique series + date).
 */
export async function generateSeriesTables(now = new Date()): Promise<{ created: number }> {
  if (!isDbConfigured()) return { created: 0 };
  const db = getDb();
  const window = seriesWindow(amsterdamToday(now));
  const [allSeries, pauses, skips, existing] = await Promise.all([
    db.select().from(jouwTafelSeries).where(eq(jouwTafelSeries.active, true)),
    loadPauses(),
    db.select().from(jouwTafelSeriesSkips),
    db
      .select({ seriesId: events.seriesId, seriesDate: events.seriesDate })
      .from(events)
      .where(and(isNotNull(events.seriesId), gte(events.seriesDate, window.from))),
  ]);
  const have = new Set(existing.map((e) => `${e.seriesId}|${e.seriesDate}`));

  let created = 0;
  for (const series of allSeries) {
    const skipped = new Set(skips.filter((s) => s.seriesId === series.id).map((s) => s.tableDate));
    for (const date of seriesDates(series, window, pauses, skipped)) {
      if (have.has(`${series.id}|${date}`)) continue;
      const startsAt = seriesStartsAt(date, series.startTime);
      if (startsAt.getTime() <= now.getTime()) continue;
      const slug = await resolveUniqueEventSlug(db, generateEventSlug({ nameNl: "", city: series.city, startsAt }));
      const inserted = await db
        .insert(events)
        .values({
          slug,
          workflowStatus: "published",
          city: series.city,
          startsAt,
          endsAt: new Date(startsAt.getTime() + TABLE_HOURS * 60 * 60 * 1000),
          priceCents: JOUW_TAFEL_SEAT_PRICE_CENTS,
          capacity: series.defaultCapacity,
          experienceType: JOUW_TAFEL_TYPE,
          imageUrl: DEFAULT_EVENT_IMAGE,
          nameNl: "Sunday Table",
          nameEn: "Sunday Table",
          categoryNl: "SUNDAY TABLE",
          categoryEn: "SUNDAY TABLE",
          publishedAt: now,
          seriesId: series.id,
          seriesDate: date,
          extras: {},
        })
        .onConflictDoNothing()
        .returning({ id: events.id });
      if (inserted.length > 0) created += 1;
    }
  }
  if (created > 0) revalidateTag(PUBLISHED_EVENTS_CACHE_TAG, "max");
  return { created };
}

/** A series date an admin removed is never created again. */
export async function recordSeriesSkip(seriesId: string, tableDate: string): Promise<void> {
  await getDb().insert(jouwTafelSeriesSkips).values({ seriesId, tableDate }).onConflictDoNothing();
}

/**
 * Removes the not-yet-booked series tables that fall in a pause (a pause
 * added after they were made). Tables with bookings stay: the admin decides.
 */
export async function removeUnbookedTablesInPause(pause: { startsOn: string; endsOn: string }): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: events.id, spotsSold: events.spotsSold })
    .from(events)
    .where(
      and(
        isNotNull(events.seriesId),
        gte(events.seriesDate, pause.startsOn),
        sql`${events.seriesDate} <= ${pause.endsOn}`,
      ),
    );
  const unsold = rows.filter((r) => r.spotsSold === 0).map((r) => r.id);
  if (unsold.length === 0) return 0;
  const booked = await db
    .selectDistinct({ eventId: bookings.eventId })
    .from(bookings)
    .where(inArray(bookings.eventId, unsold));
  const bookedIds = new Set(booked.map((b) => b.eventId));
  const removable = unsold.filter((id) => !bookedIds.has(id));
  if (removable.length === 0) return 0;
  await db.delete(events).where(inArray(events.id, removable));
  revalidateTag(PUBLISHED_EVENTS_CACHE_TAG, "max");
  return removable.length;
}

// ------------------------------------------------------------------ admin

export type SeriesTableRow = {
  id: string;
  slug: string;
  seriesId: string | null;
  city: string;
  date: string;
  startsAt: string;
  capacity: number;
  spotsSold: number;
  comingSoon: boolean;
  membersOnlyUntil: string | null;
  venueId: string | null;
  venueName: string | null;
  /** Close and still without a venue (for our own planning). */
  needsAttention: boolean;
};

export type SeriesAdminData = {
  series: JouwTafelSeries[];
  pauses: JouwTafelPause[];
  tables: SeriesTableRow[];
  venues: { id: string; name: string; city: string }[];
};

/** Everything the "Sunday Table" admin tab shows: the series, the pauses
 * and every upcoming "Jouw tafel" table (also ones made by hand). */
export async function loadSeriesAdminData(now = new Date()): Promise<SeriesAdminData> {
  const db = getDb();
  const today = amsterdamToday(now);
  const warnBefore = addDays(today, SERIES_WARN_DAYS);
  const [series, pauses, rows, venueRows] = await Promise.all([
    db.select().from(jouwTafelSeries).orderBy(asc(jouwTafelSeries.firstDate), asc(jouwTafelSeries.city)),
    loadPauses(),
    db
      .select()
      .from(events)
      .where(and(eq(events.experienceType, JOUW_TAFEL_TYPE), gte(events.startsAt, now)))
      .orderBy(asc(events.startsAt), asc(events.city)),
    db.select({ id: venues.id, name: venues.name, city: venues.city }).from(venues).orderBy(asc(venues.city), asc(venues.name)),
  ]);
  const links =
    rows.length > 0
      ? await db
          .select({ eventId: eventVenues.eventId, venueId: eventVenues.venueId })
          .from(eventVenues)
          .where(inArray(eventVenues.eventId, rows.map((r) => r.id)))
      : [];
  const venueOf = new Map<string, string>();
  for (const link of links) if (!venueOf.has(link.eventId)) venueOf.set(link.eventId, link.venueId);
  const venueName = new Map(venueRows.map((v) => [v.id, v.name]));

  const tables: SeriesTableRow[] = rows.map((r) => {
    const date = r.seriesDate ?? amsterdamDateIso(r.startsAt);
    const comingSoon = Boolean(r.extras?.comingSoon);
    const venueId = venueOf.get(r.id) ?? null;
    return {
      id: r.id,
      slug: r.slug,
      seriesId: r.seriesId,
      city: r.city,
      date,
      startsAt: r.startsAt.toISOString(),
      capacity: r.capacity,
      spotsSold: r.spotsSold,
      comingSoon,
      membersOnlyUntil: r.membersOnlyUntil?.toISOString() ?? null,
      venueId,
      venueName: venueId ? venueName.get(venueId) ?? null : null,
      needsAttention: date <= warnBefore && !venueId,
    };
  });
  return { series, pauses, tables, venues: venueRows };
}
