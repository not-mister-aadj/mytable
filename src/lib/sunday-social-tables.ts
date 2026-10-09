import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { events, eventVenues, venues } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { sundayTableLocationPath } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { SUNDAY_TABLE_LP_CITIES, sundayTableLpCityFromSlug } from "@/data/sunday-table-lp-cities";
import { getJouwTafelEvents } from "@/lib/jouw-tafel/data";
import {
  JOUW_TAFEL_SEAT_PRICE_CENTS,
  bookingOpensOverride,
  isNoLongerBookable,
  withBookingWindow,
} from "@/lib/jouw-tafel/logic";
import { agendaImageForVenue } from "@/lib/sunday-table-agenda-item";
import { amsterdamDateIso, formatSundayTableCardDateTime } from "@/lib/sunday-wine-table";

/**
 * One Sunday Social per city per Sunday, shown in two places: on the agenda
 * (book directly, no quiz) and in "Kies je zondag". The tables the series
 * plans every 4 weeks in each city (experience_type "jouw-tafel") are those
 * Sundays; this module puts them on the Sunday Social agenda and pages,
 * next to the hand-made Sunday Socials (experience_type "sunday-table").
 */

/** Every city a Sunday Social can be in, with its URL slug. The first four
 * also have their own city page (sunday-table-lp-cities). */
export const SUNDAY_SOCIAL_CITIES: ReadonlyArray<{ slug: string; name: string }> = [
  ...SUNDAY_TABLE_LP_CITIES,
  { slug: "amsterdam", name: "Amsterdam" },
  { slug: "breda", name: "Breda" },
  { slug: "nijmegen", name: "Nijmegen" },
  { slug: "groningen", name: "Groningen" },
];

export function sundaySocialCityFromSlug(slug: string): { slug: string; name: string } | null {
  return SUNDAY_SOCIAL_CITIES.find((c) => c.slug === slug) ?? null;
}

export function sundaySocialSlugFromCity(city: string): string | null {
  const key = city.trim().toLowerCase();
  return SUNDAY_SOCIAL_CITIES.find((c) => c.name.toLowerCase() === key)?.slug ?? null;
}

/** True when the city has its own /sunday-social/[city] page. */
export function hasSundaySocialCityPage(slug: string): boolean {
  return sundayTableLpCityFromSlug(slug) !== null;
}

type VenueInfo = { name: string; address: string | null };

/** The first venue an admin set on each table (event_venues), by event id. */
async function venuesByEvent(eventIds: string[]): Promise<Map<string, VenueInfo>> {
  const out = new Map<string, VenueInfo>();
  if (!isDbConfigured() || eventIds.length === 0) return out;
  const rows = await getDb()
    .select({ eventId: eventVenues.eventId, name: venues.name, address: venues.address })
    .from(eventVenues)
    .innerJoin(venues, eq(venues.id, eventVenues.venueId))
    .where(inArray(eventVenues.eventId, eventIds))
    .orderBy(asc(eventVenues.position));
  for (const row of rows) {
    if (!out.has(row.eventId)) out.set(row.eventId, { name: row.name, address: row.address });
  }
  return out;
}

/** A series table that can be booked right now. */
export type BookableSundaySocial = {
  id: string;
  city: string;
  citySlug: string;
  /** Amsterdam date, YYYY-MM-DD (the date page URL). */
  dateIso: string;
  startsAt: Date;
  bracket: string | null;
  capacity: number;
  spotsSold: number;
  priceCents: number;
  venueName: string | null;
  imageUrl: string | null;
};

/**
 * The series tables that can be booked right now: open (from 4 weeks
 * before), not full, not closed (an empty table closes 14 days before).
 * A city without such a Sunday is left out.
 */
export async function getBookableSundaySocials(): Promise<BookableSundaySocial[]> {
  const { events: tables, now } = await getJouwTafelEvents();
  const bookable = tables.filter(
    (t) => !t.comingSoon && !isNoLongerBookable(t, now) && sundaySocialSlugFromCity(t.city) !== null,
  );
  if (bookable.length === 0) return [];
  const ids = bookable.map((t) => t.id);
  const [venueMap, imageRows] = await Promise.all([
    venuesByEvent(ids),
    isDbConfigured()
      ? getDb().select({ id: events.id, imageUrl: events.imageUrl }).from(events).where(inArray(events.id, ids))
      : Promise.resolve([] as Array<{ id: string; imageUrl: string | null }>),
  ]);
  const images = new Map(imageRows.map((r) => [r.id, r.imageUrl]));
  return bookable.map((t) => {
    const startsAt = new Date(t.startsAt);
    return {
      id: t.id,
      city: t.city,
      citySlug: sundaySocialSlugFromCity(t.city)!,
      dateIso: amsterdamDateIso(startsAt),
      startsAt,
      bracket: t.bracket,
      capacity: t.capacity,
      spotsSold: t.spotsSold,
      priceCents: t.priceCents,
      venueName: venueMap.get(t.id)?.name ?? null,
      imageUrl: images.get(t.id) ?? null,
    };
  });
}

/** The bookable series tables as agenda cards. */
export async function getBookableSundaySocialItems(locale: Locale): Promise<ExperienceItem[]> {
  const tables = await getBookableSundaySocials();
  return tables.map(
    (t) =>
      ({
        id: `sunday-social-${t.id}`,
        city: t.city,
        experienceName: t.bracket ? `Sunday Social · ${t.bracket}` : "Sunday Social",
        category: "Sunday Social",
        dateTime: formatSundayTableCardDateTime(t.startsAt, locale),
        startsAt: t.startsAt.toISOString(),
        price: t.priceCents / 100,
        status: "available",
        capacity: t.capacity,
        spotsSold: t.spotsSold,
        image: agendaImageForVenue(t.venueName ?? "", t.imageUrl),
        mood: "tastings",
        femaleOnly: false,
        externalHref: sundayTableLocationPath(locale, t.citySlug, t.dateIso),
      }) satisfies ExperienceItem,
  );
}

/** A series table on one Amsterdam date in a city, ready for the Sunday
 * Social date page: venue (when an admin set one), price and whether it
 * can be booked now. */
export type SundaySocialSeriesTable = {
  id: string;
  nameNl: string;
  nameEn: string;
  capacity: number;
  spotsSold: number;
  priceCents: number;
  imageUrl: string | null;
  /** Not bookable yet (opens 4 weeks before). */
  comingSoon: boolean;
  /** Full, closed empty or too close to the date. */
  closed: boolean;
  venue: VenueInfo | null;
};

export async function findSundaySocialSeriesTable(
  cityName: string,
  dateIso: string,
  now: number = Date.now(),
): Promise<SundaySocialSeriesTable | null> {
  if (!isDbConfigured()) return null;
  const day = Date.parse(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(day)) return null;
  const rows = await getDb()
    .select()
    .from(events)
    .where(
      and(
        eq(events.experienceType, "jouw-tafel"),
        eq(events.city, cityName),
        eq(events.workflowStatus, "published"),
        gte(events.startsAt, new Date(day - 12 * 60 * 60 * 1000)),
        lt(events.startsAt, new Date(day + 36 * 60 * 60 * 1000)),
      ),
    )
    .orderBy(asc(events.startsAt));
  const row = rows.find((r) => amsterdamDateIso(r.startsAt) === dateIso);
  if (!row) return null;
  const startsAt = row.startsAt.toISOString();
  const bookingOpensAt = bookingOpensOverride(row.extras);
  const windowed = withBookingWindow(
    {
      startsAt,
      comingSoon: Boolean((row.extras as { comingSoon?: boolean } | null)?.comingSoon),
      membersOnlyUntil: row.membersOnlyUntil?.toISOString() ?? null,
      bookingOpensAt,
    },
    now,
  );
  const venue = (await venuesByEvent([row.id])).get(row.id) ?? null;
  return {
    id: row.id,
    nameNl: row.nameNl,
    nameEn: row.nameEn,
    capacity: row.capacity,
    spotsSold: row.spotsSold,
    priceCents: JOUW_TAFEL_SEAT_PRICE_CENTS,
    imageUrl: row.imageUrl,
    comingSoon: windowed.comingSoon,
    closed: isNoLongerBookable({ startsAt, capacity: row.capacity, spotsSold: row.spotsSold, bookingOpensAt }, now),
    venue,
  };
}
