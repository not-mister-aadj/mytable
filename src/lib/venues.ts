import { eq, inArray, asc } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { Event, Venue } from "@/db/schema";
import { venues } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { parseEventExtras } from "@/lib/event-extras";
import {
  DEFAULT_EXPERIENCE_TYPE,
  getVenueIdsForExperienceType,
} from "@/lib/experience-types";
import { getExperienceVenues } from "@/data/experience-venues";

export function venueToExperienceVenue(venue: Venue, locale: Locale): ExperienceVenue {
  const description =
    locale === "nl"
      ? venue.descriptionNl ?? venue.descriptionEn ?? ""
      : venue.descriptionEn ?? venue.descriptionNl ?? "";
  return {
    name: venue.name,
    area: venue.area ?? venue.city,
    atmosphere: venue.atmosphere ?? "",
    description,
    image: venue.imageUrl ?? "/images/restaurant-interior.jpg",
  };
}

export async function fetchVenuesByIds(ids: string[]): Promise<Venue[]> {
  if (!ids.length || !isDbConfigured()) return [];
  const db = getDb();
  const rows = await db.select().from(venues).where(inArray(venues.id, ids));
  const byId = new Map(rows.map((v) => [v.id, v]));
  return ids.map((id) => byId.get(id)).filter((v): v is Venue => Boolean(v));
}

export async function getAllVenues(): Promise<Venue[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();
  return db.select().from(venues).orderBy(asc(venues.city), asc(venues.name));
}

export async function getVenueById(id: string): Promise<Venue | undefined> {
  if (!isDbConfigured()) return undefined;
  const db = getDb();
  const [row] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  return row;
}

function filterVenuesForEventCity(venueRows: Venue[], eventCity: string): Venue[] {
  const inCity = venueRows.filter(
    (v) => v.city.toLowerCase() === eventCity.toLowerCase(),
  );
  return inCity.length > 0 ? inCity : venueRows;
}

/** Venues from experience type (all wine tastings, etc.); legacy per-event override as fallback */
export async function getEventVenues(
  event: Event,
  locale: Locale,
  legacyExperienceId?: string,
): Promise<ExperienceVenue[]> {
  const typeSlug = event.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
  let ids = await getVenueIdsForExperienceType(typeSlug);

  if (ids.length === 0) {
    const extras = parseEventExtras(event.extras);
    if (extras.venueIds?.length) ids = extras.venueIds;
    else if (event.venueId) ids = [event.venueId];
  }

  if (ids.length > 0) {
    const rows = await fetchVenuesByIds(ids);
    const filtered = filterVenuesForEventCity(rows, event.city);
    if (filtered.length > 0) {
      return filtered.map((v) => venueToExperienceVenue(v, locale));
    }
  }

  return getExperienceVenues(
    legacyExperienceId ?? event.legacyId ?? event.id,
    "tastings",
  );
}
