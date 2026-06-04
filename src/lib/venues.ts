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

function filterVenuesForEventCity(venueRows: Venue[], eventCity: string): Venue[] {
  const inCity = venueRows.filter(
    (v) => v.city.toLowerCase() === eventCity.toLowerCase(),
  );
  return inCity.length > 0 ? inCity : venueRows;
}

/** Venues from experience type; per-event venueIds override as fallback */
export async function getEventVenues(
  event: Event,
  locale: Locale,
  legacyExperienceId?: string,
): Promise<ExperienceVenue[]> {
  const typeSlug = event.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
  const extras = parseEventExtras(event.extras);
  let ids = extras.venueIds?.length
    ? extras.venueIds
    : await getVenueIdsForExperienceType(typeSlug);

  if (ids.length === 0 && event.venueId) {
    ids = [event.venueId];
  }

  if (ids.length > 0) {
    const rows = await fetchVenuesByIdsCached(ids);
    const filtered = filterVenuesForEventCity(rows, event.city);
    if (filtered.length > 0) {
      return filtered.map((v) => venueToExperienceVenue(v, locale));
    }
  }

  const typeDef = getExperienceTypeDefinition(typeSlug);
  return getExperienceVenues(
    legacyExperienceId ?? event.legacyId ?? event.id,
    typeDef?.mood ?? "tastings",
  );
}

export async function getVenueRouteCoords(
  event: Event,
): Promise<{ label: string; lat: number; lng: number }[]> {
  const extras = parseEventExtras(event.extras);
  const ids = extras.venueIds ?? [];
  if (!ids.length) return [];
  const rows = await fetchVenuesByIdsCached(ids);
  return rows
    .map((v) => {
      const lat = v.latitude ? Number.parseFloat(v.latitude) : NaN;
      const lng = v.longitude ? Number.parseFloat(v.longitude) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { label: v.name, lat, lng };
    })
    .filter((p): p is { label: string; lat: number; lng: number } => p !== null);
}
