import { and, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { sundayTableLocationPath } from "@/i18n/config";
import type { SundayTableLpCitySlug } from "@/data/sunday-table-lp-cities";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";
import { hasEnoughSoldToShowSpots } from "@/lib/experience-booking";
import { getUpcomingSundayTableLocations } from "@/lib/sunday-table-locations";
import {
  formatSundayTableCardDate,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

export type SundayTableCityDate = {
  tableDate: string;
  /** "Zondag 25 oktober" */
  dateLabel: string;
  venueName: string;
  /** "35+" or "20-39", taken from the event name ("Sunday Table · 35+"). */
  ageBracket: string | null;
  priceEuros: number;
  status: "available" | "soldOut" | "comingSoon";
  /** Only set once enough seats are sold for the count to help rather than hurt. */
  spotsLeft: number | null;
  href: string;
};

function ageBracketFromEventName(name: string): string | null {
  const parts = name.split("·").map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

/** Every upcoming Sunday Table in one city that has a published ticketed
 * event, soonest first. Locations without an event are skipped, since their
 * date page would 404. */
export async function getUpcomingSundayTableDates(
  cityName: string,
  citySlug: SundayTableLpCitySlug,
  locale: Locale,
): Promise<SundayTableCityDate[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();
  const locations = await getUpcomingSundayTableLocations(cityName);

  const dates = await Promise.all(
    locations.map(async (location): Promise<SundayTableCityDate | null> => {
      const startsAt = parseAmsterdamDateIso(location.tableDate);
      if (!startsAt) return null;
      const [event] = await db
        .select({
          nameNl: events.nameNl,
          nameEn: events.nameEn,
          capacity: events.capacity,
          spotsSold: events.spotsSold,
          priceCents: events.priceCents,
          extras: events.extras,
        })
        .from(events)
        .where(
          and(
            eq(events.experienceType, "sunday-table"),
            eq(events.city, cityName),
            eq(events.startsAt, startsAt),
            eq(events.workflowStatus, "published"),
          ),
        )
        .limit(1);
      if (!event) return null;

      const seatsLeft = Math.max(0, event.capacity - event.spotsSold);
      const dateLabel = formatSundayTableCardDate(startsAt, locale);
      return {
        tableDate: location.tableDate,
        dateLabel:
          dateLabel.charAt(0).toLocaleUpperCase(locale === "nl" ? "nl-NL" : "en-GB") +
          dateLabel.slice(1),
        venueName: location.venueName,
        ageBracket: ageBracketFromEventName(
          locale === "en" ? event.nameEn : event.nameNl,
        ),
        priceEuros: Math.round(event.priceCents / 100),
        status: event.extras?.comingSoon
          ? "comingSoon"
          : seatsLeft === 0
            ? "soldOut"
            : "available",
        spotsLeft: hasEnoughSoldToShowSpots(event.spotsSold) ? seatsLeft : null,
        href: sundayTableLocationPath(locale, citySlug, location.tableDate),
      };
    }),
  );

  return dates.filter((date): date is SundayTableCityDate => date !== null);
}

/** The soonest bookable table per age bracket, in date order, so the hero
 * can offer "your" next table instead of just the next one overall. */
export function nextBookablePerBracket(
  dates: SundayTableCityDate[],
): SundayTableCityDate[] {
  const seen = new Set<string>();
  const result: SundayTableCityDate[] = [];
  for (const date of dates) {
    if (date.status !== "available") continue;
    const key = date.ageBracket ?? "";
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(date);
  }
  return result;
}
