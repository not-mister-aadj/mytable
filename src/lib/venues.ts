import { cache } from "react";
import { eq, inArray, asc } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { Event, Venue } from "@/db/schema";
import { venues } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { parseEventExtras } from "@/lib/event-extras";
import { venueToExperienceVenue } from "@/lib/venue-display";
export { venueToExperienceVenue } from "@/lib/venue-display";
import {
  DEFAULT_EXPERIENCE_TYPE,
  getExperienceTypeDefinition,
  getVenueIdsForExperienceType,
} from "@/lib/experience-types";
import { getExperienceVenues } from "@/data/experience-venues";
import {
  isLocationTbdVenueId,
  locationTbdExperienceVenue,
  normalizeVenueId,
} from "@/lib/location-tbd-venue";

/** Columns safe when image_meta / lat-lng migrations not applied yet */
const venueSelectCore = {
  id: venues.id,
  name: venues.name,
  city: venues.city,
  area: venues.area,
  address: venues.address,
  atmosphere: venues.atmosphere,
  descriptionNl: venues.descriptionNl,
  descriptionEn: venues.descriptionEn,
  imageUrl: venues.imageUrl,
  createdAt: venues.createdAt,
};

type VenueCoreRow = {
  id: string;
  name: string;
  city: string;
  area: string | null;
  address: string | null;
  atmosphere: string | null;
  descriptionNl: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  createdAt: Date;
};

function withOptionalVenueFields(
  row: VenueCoreRow,
  extra?: Partial<Pick<Venue, "imageMeta" | "latitude" | "longitude">>,
): Venue {
  return {
    ...row,
    imageMeta: extra?.imageMeta ?? null,
    latitude: extra?.latitude ?? null,
    longitude: extra?.longitude ?? null,
  };
}

function isMissingVenueColumnError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("image_meta") ||
    msg.includes("latitude") ||
    msg.includes("longitude")
  );
}

async function selectAllVenuesRows(db: ReturnType<typeof getDb>): Promise<Venue[]> {
  try {
    return await db.select().from(venues).orderBy(asc(venues.city), asc(venues.name));
  } catch (error) {
    if (!isMissingVenueColumnError(error)) throw error;
    const rows = await db
      .select(venueSelectCore)
      .from(venues)
      .orderBy(asc(venues.city), asc(venues.name));
    return rows.map((r) => withOptionalVenueFields(r));
  }
}

async function selectVenuesByIdsRows(
  db: ReturnType<typeof getDb>,
  ids: string[],
): Promise<Venue[]> {
  try {
    return await db.select().from(venues).where(inArray(venues.id, ids));
  } catch (error) {
    if (!isMissingVenueColumnError(error)) throw error;
    const rows = await db
      .select(venueSelectCore)
      .from(venues)
      .where(inArray(venues.id, ids));
    return rows.map((r) => withOptionalVenueFields(r));
  }
}

async function fetchVenuesByIdsUncached(ids: string[]): Promise<Venue[]> {
  if (!ids.length || !isDbConfigured()) return [];
  const db = getDb();
  const rows = await selectVenuesByIdsRows(db, ids);
  const byId = new Map(rows.map((v) => [v.id, v]));
  return ids.map((id) => byId.get(id)).filter((v): v is Venue => Boolean(v));
}

export const fetchVenuesByIdsCached = cache(fetchVenuesByIdsUncached);

export async function fetchVenuesByIds(ids: string[]): Promise<Venue[]> {
  return fetchVenuesByIdsCached(ids);
}

export async function getAllVenues(): Promise<Venue[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();
  return selectAllVenuesRows(db);
}

export async function getVenueById(id: string): Promise<Venue | undefined> {
  if (!isDbConfigured()) return undefined;
  const db = getDb();
  try {
    const [row] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
    return row;
  } catch (error) {
    if (!isMissingVenueColumnError(error)) throw error;
    const [row] = await db
      .select(venueSelectCore)
      .from(venues)
      .where(eq(venues.id, id))
      .limit(1);
    return row ? withOptionalVenueFields(row) : undefined;
  }
}

async function orderedExperienceVenues(
  ids: string[],
  locale: Locale,
): Promise<ExperienceVenue[]> {
  if (!ids.length) return [];

  const realIds = ids.filter((id) => !isLocationTbdVenueId(id));
  const rows =
    realIds.length > 0 ? await fetchVenuesByIdsCached(realIds) : [];
  const byId = new Map(rows.map((v) => [v.id, v]));

  return ids
    .map((id) => {
      const normalizedId = normalizeVenueId(id);
      if (isLocationTbdVenueId(normalizedId)) {
        return locationTbdExperienceVenue(locale);
      }
      const row = byId.get(id);
      return row ? venueToExperienceVenue(row, locale) : null;
    })
    .filter((v): v is ExperienceVenue => v !== null);
}

async function resolveEventVenueIds(event: Event): Promise<string[]> {
  const extras = parseEventExtras(event.extras);
  if (Array.isArray(extras.venueIds)) {
    return extras.venueIds;
  }
  const typeSlug = event.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
  const typeIds = await getVenueIdsForExperienceType(typeSlug);
  if (typeIds.length > 0) return typeIds;
  if (event.venueId) return [event.venueId];
  return [];
}

/** Per-event venueIds (in order); else defaults from experience type */
export async function getEventVenues(
  event: Event,
  locale: Locale,
  legacyExperienceId?: string,
): Promise<ExperienceVenue[]> {
  const extras = parseEventExtras(event.extras);
  const hasExplicitVenueIds = Array.isArray(extras.venueIds);
  const typeSlug = event.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
  const ids = await resolveEventVenueIds(event);

  if (ids.length > 0) {
    const venues = await orderedExperienceVenues(ids, locale);
    if (venues.length > 0) return venues;
  }

  if (hasExplicitVenueIds) {
    return [];
  }

  const typeDef = getExperienceTypeDefinition(typeSlug);
  return getExperienceVenues(
    legacyExperienceId ?? event.legacyId ?? event.id,
    typeDef?.mood ?? "tastings",
  );
}

async function coordsForVenue(
  venue: Venue,
): Promise<{ label: string; lat: number; lng: number } | null> {
  const { geocodeVenueCached, parseStoredCoords } = await import("@/lib/geocode");

  const stored = parseStoredCoords(venue.latitude, venue.longitude);
  const resolved =
    stored ??
    (venue.city
      ? await geocodeVenueCached(venue.city, venue.address)
      : null);

  if (!resolved) return null;

  const lat = Number.parseFloat(resolved.lat);
  const lng = Number.parseFloat(resolved.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { label: venue.name, lat, lng };
}

export async function getVenueRouteCoords(
  event: Event,
): Promise<{ label: string; lat: number; lng: number }[]> {
  const ids = (await resolveEventVenueIds(event)).filter(
    (id) => !isLocationTbdVenueId(id),
  );
  if (!ids.length) return [];

  const rows = await fetchVenuesByIdsCached(ids);
  const byId = new Map(rows.map((v) => [v.id, v]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((v): v is Venue => Boolean(v));

  const points = await Promise.all(ordered.map((v) => coordsForVenue(v)));
  return points.filter(
    (p): p is { label: string; lat: number; lng: number } => p !== null,
  );
}
