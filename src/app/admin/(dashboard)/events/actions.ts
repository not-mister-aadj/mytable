"use server";

import { eq } from "drizzle-orm";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { redirect } from "next/navigation";

export type EventFormState = {
  slug: string;
  city: string;
  startsAt: string;
  endsAt: string;
  priceCents: string;
  capacity: string;
  femaleOnly: boolean;
  imageUrl: string;
  nameNl: string;
  nameEn: string;
  taglineNl: string;
  taglineEn: string;
  categoryNl: string;
  categoryEn: string;
};

function parseForm(data: FormData): EventFormState {
  return {
    slug: String(data.get("slug") ?? "").trim(),
    city: String(data.get("city") ?? "").trim(),
    startsAt: String(data.get("startsAt") ?? ""),
    endsAt: String(data.get("endsAt") ?? ""),
    priceCents: String(data.get("priceCents") ?? ""),
    capacity: String(data.get("capacity") ?? "14"),
    femaleOnly: data.get("femaleOnly") === "on",
    imageUrl: String(data.get("imageUrl") ?? "").trim(),
    nameNl: String(data.get("nameNl") ?? "").trim(),
    nameEn: String(data.get("nameEn") ?? "").trim(),
    taglineNl: String(data.get("taglineNl") ?? "").trim(),
    taglineEn: String(data.get("taglineEn") ?? "").trim(),
    categoryNl: String(data.get("categoryNl") ?? "PROEVERIJ").trim(),
    categoryEn: String(data.get("categoryEn") ?? "TASTING").trim(),
  };
}

function toEventValues(form: EventFormState) {
  const priceCents = Number.parseInt(form.priceCents, 10);
  const capacity = Number.parseInt(form.capacity, 10);
  if (!form.slug || !form.city || !form.startsAt || !Number.isFinite(priceCents)) {
    throw new Error("Vul alle verplichte velden in.");
  }
  return {
    slug: form.slug,
    city: form.city,
    startsAt: new Date(form.startsAt),
    endsAt: form.endsAt ? new Date(form.endsAt) : null,
    priceCents,
    capacity: Number.isFinite(capacity) ? capacity : 14,
    femaleOnly: form.femaleOnly,
    imageUrl: form.imageUrl || "/images/wine-bar.jpg",
    nameNl: form.nameNl,
    nameEn: form.nameEn,
    taglineNl: form.taglineNl || null,
    taglineEn: form.taglineEn || null,
    categoryNl: form.categoryNl,
    categoryEn: form.categoryEn,
    updatedAt: new Date(),
  };
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const form = parseForm(formData);
  const values = toEventValues(form);
  const db = getDb();
  const [row] = await db
    .insert(events)
    .values({
      ...values,
      workflowStatus: "draft",
    })
    .returning();
  redirect(adminPath(`/events/${row.id}/edit`));
}

export async function updateEventAction(id: string, formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const form = parseForm(formData);
  const values = toEventValues(form);
  const db = getDb();
  const [row] = await db
    .update(events)
    .set(values)
    .where(eq(events.id, id))
    .returning();
  if (row.workflowStatus === "published") {
    revalidateEventPaths(row.slug);
  }
  redirect(adminPath(`/events/${id}/edit?saved=1`));
}

export async function publishEventAction(id: string) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({
      workflowStatus: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();
  if (row) revalidateEventPaths(row.slug);
  redirect(adminPath(`/events/${id}/edit?published=1`));
}

export async function unpublishEventAction(id: string) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({
      workflowStatus: "draft",
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();
  if (row) revalidateEventPaths(row.slug);
  redirect(adminPath(`/events/${id}/edit?unpublished=1`));
}

export async function deleteEventAction(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.delete(events).where(eq(events.id, id));
  redirect(adminPath("/events"));
}
