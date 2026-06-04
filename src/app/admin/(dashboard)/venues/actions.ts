"use server";

import { eq } from "drizzle-orm";
import { venues } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { parseImageSettings } from "@/lib/image-settings";
import { DEFAULT_VENUE_IMAGE } from "@/lib/image-settings";
import { geocodeVenueAddress } from "@/lib/geocode";

async function parseVenueForm(data: FormData) {
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
  const area = String(data.get("area") ?? "").trim();
  const atmosphere = String(data.get("atmosphere") ?? "").trim();
  const address = String(data.get("address") ?? "").trim();

  if (!name || !city || !descriptionNl) {
    throw new Error("Naam, stad en beschrijving (NL) zijn verplicht.");
  }

  const coords = await geocodeVenueAddress(city, address || null);

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
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  };
}

export async function createVenueAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const values = await parseVenueForm(formData);
  const db = getDb();
  const [row] = await db.insert(venues).values(values).returning();
  redirect(adminPath(`/venues/${row.id}/edit`));
}

export async function updateVenueAction(id: string, formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const values = await parseVenueForm(formData);
  const db = getDb();
  await db.update(venues).set(values).where(eq(venues.id, id));
  redirect(adminPath(`/venues/${id}/edit?saved=1`));
}

export async function deleteVenueAction(id: string) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  await db.delete(venues).where(eq(venues.id, id));
  redirect(adminPath("/venues"));
}
