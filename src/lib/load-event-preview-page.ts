import { eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRelatedExperiences } from "@/lib/experiences";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { enrichDbEvent } from "@/lib/event-mapper";
import {
  getTypeContent,
  routePointsFromTypeContent,
} from "@/lib/experience-type-content";
import { getEventVenues, getVenueRouteCoords } from "@/lib/venues";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import { getRouteMapPoints } from "@/data/experience-route-map";
import { getExperienceVenues as getCatalogVenues } from "@/data/experience-venues";

export async function loadEventPreviewPageData(
  eventId: string,
  locale: Locale,
) {
  if (!isDbConfigured()) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!row) return null;

  const dict = getDictionary(locale);
  const experience = await enrichDbEvent(row, locale);

  const related = await getRelatedExperiences(locale, experience);

  let eventVenues;
  let routePoints;

  const [venues, venueCoords, typeContent] = await Promise.all([
    getEventVenues(row, locale, experience.id),
    getVenueRouteCoords(row),
    getTypeContent(row.experienceType ?? DEFAULT_EXPERIENCE_TYPE),
  ]);
  eventVenues = venues;
  routePoints = routePointsFromTypeContent(
    typeContent,
    row.city,
    venues,
    experience.id,
    venueCoords.length > 0 ? venueCoords : undefined,
  );

  if (venues.length === 0 && routePoints.length === 0) {
    const catalogVenues = getCatalogVenues(experience.id, experience.mood);
    eventVenues = catalogVenues;
    routePoints = getRouteMapPoints(
      experience.id,
      experience.city,
      catalogVenues.map((v) => v.name),
    );
  }

  return {
    dict,
    locale,
    experience,
    related,
    eventVenues,
    routePoints,
  };
}

export function parsePreviewLocale(raw: string | undefined): Locale {
  return raw === "en" ? "en" : "nl";
}

export function isValidPreviewLocale(raw: string | undefined): raw is Locale {
  return raw === "nl" || raw === "en";
}
