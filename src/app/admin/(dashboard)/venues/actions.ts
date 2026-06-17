"use server";

import { eq } from "drizzle-orm";
import { events, experienceTypes, venues } from "@/db/schema";
import type { Venue } from "@/db/schema";
import { parseEventExtras } from "@/lib/event-extras";
import {
  eventExtrasReferenceVenue,
  getVenueGallerySettings,
  reconcileVenueImageRefsInExtras,
  stripVenueImageRefs,
} from "@/lib/venue-images";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseImageSettings, parseGalleryImages } from "@/lib/image-settings";
import { DEFAULT_VENUE_IMAGE } from "@/lib/image-settings";
import {
  geocodeVenueAddress,
  parseStoredCoords,
  type GeocodeResult,
} from "@/lib/geocode";
import { formatEventSaveError } from "@/lib/event-form-validation";
import { ensureVenueColumns } from "@/lib/ensure-venue-columns";
import { getVenueById } from "@/lib/venues";

export type VenueSaveState = {
  error: string | null;
};

const initialSaveState: VenueSaveState = { error: null };

function venueAddressKey(city: string, address: string | null) {
  return `${city.trim().toLowerCase()}|${(address ?? "").trim().toLowerCase()}`;
}

async function resolveVenueCoords(
  city: string,
  address: string | null,
  existing?: Venue,
): Promise<GeocodeResult | null> {
  const unchanged =
    existing &&
    venueAddressKey(city, address) ===
      venueAddressKey(existing.city, existing.address);

  if (unchanged) {
    return parseStoredCoords(existing.latitude, existing.longitude);
  }

  const fresh = await geocodeVenueAddress(city, address);
  if (fresh) return fresh;

  if (existing) {
    return parseStoredCoords(existing.latitude, existing.longitude);
  }

  return null;
}

async function parseVenueForm(data: FormData, existing?: Venue) {
  const name = String(data.get("name") ?? "").trim();
  const city = String(data.get("city") ?? "").trim();
  const descriptionNl = String(data.get("descriptionNl") ?? "").trim();
  const descriptionEn = String(data.get("descriptionEn") ?? "").trim();
  const imageUrl = String(data.get("imageUrl") ?? "").trim();
  let imageMeta: Record<string, unknown> | null = null;
  try {
    const raw = String(data.get("imageMeta") ?? "").trim();
    if (raw) {
      const parsed = parseImageSettings(JSON.parse(raw));
      if (parsed) imageMeta = parsed as unknown as Record<string, unknown>;
    }
  } catch {
    imageMeta = null;
  }
  let galleryMeta: Record<string, unknown>[] | null = null;
  const existingGallery =
    existing && existing.galleryMeta
      ? (parseGalleryImages(existing.galleryMeta) as unknown as Record<
          string,
          unknown
        >[])
      : null;
  if (existingGallery && existingGallery.length > 0) {
    galleryMeta = existingGallery;
  }
  try {
    const rawGallery = String(data.get("galleryMeta") ?? "").trim();
    if (rawGallery) {
      const parsed = parseGalleryImages(JSON.parse(rawGallery));
      galleryMeta =
        parsed.length > 0
          ? (parsed as unknown as Record<string, unknown>[])
          : null;
    } else {
      galleryMeta = null;
    }
  } catch {
    /* Keep existing galleryMeta when JSON is invalid — avoids wiping on race. */
  }
  const area = String(data.get("area") ?? "").trim();
  const atmosphere = String(data.get("atmosphere") ?? "").trim();
  const address = String(data.get("address") ?? "").trim();

  if (!name || !city || !descriptionNl) {
    throw new Error("Naam, stad en beschrijving (NL) zijn verplicht.");
  }

  const coords = await resolveVenueCoords(city, address || null, existing);

  return {
    name,
    city,
    area: area || null,
    atmosphere: atmosphere || null,
    address: address || null,
    descriptionNl,
    descriptionEn: descriptionEn || descriptionNl,
    imageUrl: imageUrl || DEFAULT_VENUE_IMAGE,
    imageMeta,
    galleryMeta,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  };
}

async function persistCreateVenue(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  await ensureVenueColumns();
  const values = await parseVenueForm(formData);
  const [row] = await db.insert(venues).values(values).returning();
  revalidateVenueDependents();
  redirect(adminPath(`/venues/${row.id}/edit?saved=1`));
}

async function persistUpdateVenue(id: string, formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  await ensureVenueColumns();
  const existing = await getVenueById(id);
  if (!existing) throw new Error("Venue niet gevonden");

  const values = await parseVenueForm(formData, existing);
  const oldGallery = getVenueGallerySettings(existing);
  const newGallery = values.galleryMeta
    ? parseGalleryImages(values.galleryMeta)
    : [];

  await db.update(venues).set(values).where(eq(venues.id, id));

  const eventRows = await db
    .select({ id: events.id, extras: events.extras })
    .from(events);
  for (const row of eventRows) {
    const extras = parseEventExtras(row.extras);
    if (!eventExtrasReferenceVenue(extras, id)) continue;
    const reconciled = reconcileVenueImageRefsInExtras(
      extras,
      id,
      oldGallery,
      newGallery,
    );
    if (JSON.stringify(reconciled) === JSON.stringify(extras)) continue;
    await db
      .update(events)
      .set({
        extras: { ...(row.extras ?? {}), ...reconciled },
        updatedAt: new Date(),
      })
      .where(eq(events.id, row.id));
  }

  revalidateVenueDependents();
  redirect(adminPath(`/venues/${id}/edit?saved=1`));
}

function revalidateVenueDependents() {
  revalidatePath(adminPath("/venues"));
  revalidatePath(adminPath("/events"));
}

export async function createVenueAction(
  _prevState: VenueSaveState,
  formData: FormData,
): Promise<VenueSaveState> {
  try {
    await persistCreateVenue(formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: formatEventSaveError(error) };
  }
  return initialSaveState;
}

export async function updateVenueAction(
  id: string,
  _prevState: VenueSaveState,
  formData: FormData,
): Promise<VenueSaveState> {
  try {
    await persistUpdateVenue(id, formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: formatEventSaveError(error) };
  }
  return initialSaveState;
}

async function detachVenueFromReferences(
  db: ReturnType<typeof getDb>,
  venueId: string,
) {
  await db.update(events).set({ venueId: null }).where(eq(events.venueId, venueId));

  const eventRows = await db
    .select({ id: events.id, extras: events.extras })
    .from(events);
  for (const row of eventRows) {
    const extras = parseEventExtras(row.extras);
    if (!eventExtrasReferenceVenue(extras, venueId)) continue;

    const venueIds = (extras.venueIds ?? []).filter((vid) => vid !== venueId);
    const stripped = stripVenueImageRefs(extras, venueId);
    await db
      .update(events)
      .set({
        extras: {
          ...(row.extras ?? {}),
          ...stripped,
          venueIds,
        },
        updatedAt: new Date(),
      })
      .where(eq(events.id, row.id));
  }

  const typeRows = await db.select().from(experienceTypes);
  for (const typeRow of typeRows) {
    const ids = typeRow.venueIds ?? [];
    if (!ids.includes(venueId)) continue;
    await db
      .update(experienceTypes)
      .set({
        venueIds: ids.filter((vid) => vid !== venueId),
        updatedAt: new Date(),
      })
      .where(eq(experienceTypes.slug, typeRow.slug));
  }
}

export async function deleteVenueAction(id: string) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  await ensureVenueColumns();
  const venue = await getVenueById(id);
  if (!venue) throw new Error("Venue niet gevonden");

  await detachVenueFromReferences(db, id);
  await db.delete(venues).where(eq(venues.id, id));
  redirect(adminPath("/venues"));
}
