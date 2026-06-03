"use server";

import { eq } from "drizzle-orm";
import { venues } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

function parseVenueForm(data: FormData) {
  const name = String(data.get("name") ?? "").trim();
  const city = String(data.get("city") ?? "").trim();
  const descriptionNl = String(data.get("descriptionNl") ?? "").trim();
  const descriptionEn = String(data.get("descriptionEn") ?? "").trim();
  const imageUrl = String(data.get("imageUrl") ?? "").trim();
  const area = String(data.get("area") ?? "").trim();
  const atmosphere = String(data.get("atmosphere") ?? "").trim();
  const address = String(data.get("address") ?? "").trim();

  if (!name || !city || !descriptionNl) {
    throw new Error("Naam, stad en beschrijving (NL) zijn verplicht.");
  }

  return {
    name,
    city,
    area: area || null,
    atmosphere: atmosphere || null,
    address: address || null,
    descriptionNl,
    descriptionEn: descriptionEn || descriptionNl,
    imageUrl: imageUrl || "/images/restaurant-interior.jpg",
  };
}

export async function createVenueAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const values = parseVenueForm(formData);
  const db = getDb();
  const [row] = await db.insert(venues).values(values).returning();
  redirect(adminPath(`/venues/${row.id}/edit`));
}

export async function updateVenueAction(id: string, formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const values = parseVenueForm(formData);
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
