import { and, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { sundayTableLocationPath } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { sundayTableLpSlugFromCity } from "@/data/sunday-table-lp-cities";
import { images } from "@/data/images";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";
import type { SundayTableLocation } from "@/lib/sunday-table-locations";
import {
  formatSundayTableCardDateTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

/** Manually curated per-venue card photo until Sunday Table locations get
 * their own image field. Falls back to a wine-themed photo for new venues. */
export function agendaImageForVenue(venueName: string): string {
  if (venueName === "Bar Juni Rotterdam") {
    return "https://lh3.googleusercontent.com/grass-cs/ACvplmPKHPMZLbYmXXtC7a58PZZXLNLyYVbh6MRSFgUerRrfHIuVrFPWpbL6PJEEE7g98cQ-HZDirRJoY7D7WXBNHAZMPMDr3matKwDmgYtgoXZmnsoswO2hHtZNvhOCgJOql5VWJkywm4G80yYn=w1600-h1200-p-k-no";
  }
  return images.wineGlasses;
}

/** The ticketed event's own name ("Sunday Table · 20-39") and live
 * capacity/spotsSold, if one exists for this location yet. Without these,
 * getSpotsLeft() (src/lib/experience-booking.ts) falls back to a hardcoded
 * 12 for any "available" item, so the agenda card never reflected real
 * bookings. */
async function ticketedEventInfo(
  location: SundayTableLocation,
  startsAt: Date,
  locale: Locale,
): Promise<{
  name: string;
  capacity: number;
  spotsSold: number;
  comingSoon: boolean;
} | null> {
  if (!isDbConfigured()) return null;
  const db = getDb();
  const [row] = await db
    .select({
      nameNl: events.nameNl,
      nameEn: events.nameEn,
      capacity: events.capacity,
      spotsSold: events.spotsSold,
      extras: events.extras,
    })
    .from(events)
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(events.city, location.city),
        eq(events.startsAt, startsAt),
        eq(events.workflowStatus, "published"),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    name: locale === "en" ? row.nameEn : row.nameNl,
    capacity: row.capacity,
    spotsSold: row.spotsSold,
    comingSoon: Boolean(row.extras?.comingSoon),
  };
}

/** Builds the same card/list item for a Sunday Table location used on the
 * agenda page, reused wherever else a real Sunday Table needs to appear
 * alongside the generic experience catalog (e.g. the girls-only city
 * pages). Returns null when the location's city isn't a live Sunday Table
 * city or its date can't be parsed. */
export async function buildSundayTableAgendaItem(
  location: SundayTableLocation,
  locale: Locale,
): Promise<ExperienceItem | null> {
  const citySlug = sundayTableLpSlugFromCity(location.city);
  if (!citySlug) return null;

  const startsAt = parseAmsterdamDateIso(location.tableDate);
  if (!startsAt) return null;

  const ticketed = await ticketedEventInfo(location, startsAt, locale);
  const spotsLeft = ticketed
    ? Math.max(0, ticketed.capacity - ticketed.spotsSold)
    : null;

  return {
    id: `sunday-table-${location.city}-${location.tableDate}`,
    city: location.city,
    experienceName: ticketed?.name ?? "Sunday Table",
    category: "Sunday Table",
    dateTime: formatSundayTableCardDateTime(startsAt, locale),
    startsAt: startsAt.toISOString(),
    price: 0,
    status: ticketed?.comingSoon
      ? "comingSoon"
      : spotsLeft === 0
        ? "soldOut"
        : "available",
    capacity: ticketed?.capacity,
    spotsSold: ticketed?.spotsSold,
    image: agendaImageForVenue(location.venueName),
    mood: "tastings",
    femaleOnly: false,
    externalHref: sundayTableLocationPath(locale, citySlug, location.tableDate),
  };
}
