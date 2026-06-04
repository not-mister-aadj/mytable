"use server";

import { eq, inArray } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { parseEventExtras, resolveFemaleOnly } from "@/lib/event-extras";
import {
  formatEventSaveError,
  validateEventForm,
} from "@/lib/event-form-validation";
import { DEFAULT_EVENT_IMAGE, isUsableImageUrl } from "@/lib/image-settings";
import {
  DEFAULT_EXPERIENCE_TYPE,
  getExperienceTypeDefinition,
  isValidExperienceType,
} from "@/lib/experience-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

export type EventFormState = {
  slug: string;
  city: string;
  startsAt: string;
  endsAt: string;
  priceEuros: string;
  capacity: string;
  femaleOnly: boolean;
  imageUrl: string;
  nameNl: string;
  nameEn: string;
  taglineNl: string;
  taglineEn: string;
  categoryNl: string;
  categoryEn: string;
  experienceType: string;
  extras: ReturnType<typeof parseEventExtras>;
};

export type EventSaveState = {
  error: string | null;
};

const initialSaveState: EventSaveState = { error: null };

function parseForm(data: FormData): EventFormState {
  let extras = emptyExtras();
  const extrasRaw = String(data.get("extras") ?? "{}").trim();
  try {
    extras = parseEventExtras(JSON.parse(extrasRaw || "{}"));
  } catch {
    extras = emptyExtras();
  }

  return {
    slug: String(data.get("slug") ?? "").trim(),
    city: String(data.get("city") ?? "").trim(),
    startsAt: String(data.get("startsAt") ?? ""),
    endsAt: String(data.get("endsAt") ?? ""),
    priceEuros: String(data.get("priceEuros") ?? ""),
    capacity: String(data.get("capacity") ?? "14"),
    femaleOnly: data.get("femaleOnly") === "on",
    imageUrl: String(data.get("imageUrl") ?? "").trim(),
    nameNl: String(data.get("nameNl") ?? "").trim(),
    nameEn: String(data.get("nameEn") ?? "").trim(),
    taglineNl: String(data.get("taglineNl") ?? "").trim(),
    taglineEn: String(data.get("taglineEn") ?? "").trim(),
    categoryNl: String(data.get("categoryNl") ?? "PROEVERIJ").trim(),
    categoryEn: String(data.get("categoryEn") ?? "TASTING").trim(),
    experienceType: String(data.get("experienceType") ?? DEFAULT_EXPERIENCE_TYPE).trim(),
    extras,
  };
}

function emptyExtras() {
  return parseEventExtras({});
}

function toEventValues(form: EventFormState) {
  const validationError = validateEventForm(form);
  if (validationError) {
    throw new Error(validationError);
  }

  const priceEuros = Number.parseFloat(form.priceEuros.replace(",", "."));
  const capacity = Number.parseInt(form.capacity, 10);
  const experienceType = isValidExperienceType(form.experienceType)
    ? form.experienceType
    : DEFAULT_EXPERIENCE_TYPE;
  const typeDef = getExperienceTypeDefinition(experienceType);

  return {
    slug: form.slug,
    city: form.city,
    startsAt: new Date(form.startsAt),
    endsAt: form.endsAt ? new Date(form.endsAt) : null,
    priceCents: Math.round(priceEuros * 100),
    capacity: Number.isFinite(capacity) ? capacity : 14,
    femaleOnly: resolveFemaleOnly(
      form.femaleOnly,
      form.extras.atmosphereTags,
    ),
    imageUrl:
      form.extras.heroImage?.url ||
      (isUsableImageUrl(form.imageUrl) ? form.imageUrl : DEFAULT_EVENT_IMAGE),
    nameNl: form.nameNl,
    nameEn: form.nameEn,
    taglineNl: form.taglineNl || null,
    taglineEn: form.taglineEn || null,
    categoryNl: form.categoryNl,
    categoryEn: form.categoryEn,
    experienceType,
    mood: typeDef?.mood ?? "tastings",
    venueId: null,
    extras: form.extras as Record<string, unknown>,
    updatedAt: new Date(),
  };
}

async function persistNewEvent(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) {
    throw new Error("Database niet geconfigureerd");
  }
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
  redirect(adminPath(`/events/${row.id}/edit?saved=1`));
}

async function persistUpdateEvent(id: string, formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) {
    throw new Error("Database niet geconfigureerd");
  }
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

export async function createEventAction(
  _prevState: EventSaveState,
  formData: FormData,
): Promise<EventSaveState> {
  try {
    await persistNewEvent(formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: formatEventSaveError(error) };
  }
  return initialSaveState;
}

export async function updateEventAction(
  id: string,
  _prevState: EventSaveState,
  formData: FormData,
): Promise<EventSaveState> {
  try {
    await persistUpdateEvent(id, formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: formatEventSaveError(error) };
  }
  return initialSaveState;
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
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) throw new Error("Event niet gevonden");

  const bookingRows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.eventId, id));
  const bookingIds = bookingRows.map((b) => b.id);
  if (bookingIds.length > 0) {
    await db
      .delete(bookingEvents)
      .where(inArray(bookingEvents.bookingId, bookingIds));
    await db.delete(bookings).where(eq(bookings.eventId, id));
  }

  await db.delete(events).where(eq(events.id, id));
  if (event.workflowStatus === "published") {
    revalidateEventPaths(event.slug);
  }
  redirect(adminPath("/events"));
}

export async function duplicateEventAction(id: string) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  const [source] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!source) throw new Error("Event niet gevonden");

  const suffix = Date.now().toString(36);
  const newSlug = `${source.slug}-copy-${suffix}`.slice(0, 120);

  const [row] = await db
    .insert(events)
    .values({
      slug: newSlug,
      city: source.city,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      priceCents: source.priceCents,
      currency: source.currency,
      capacity: source.capacity,
      spotsSold: 0,
      femaleOnly: source.femaleOnly,
      experienceType: source.experienceType ?? "wine-tasting",
      mood: source.mood,
      imageUrl: source.imageUrl,
      nameNl: `${source.nameNl} (copy)`,
      nameEn: `${source.nameEn} (copy)`,
      taglineNl: source.taglineNl,
      taglineEn: source.taglineEn,
      categoryNl: source.categoryNl,
      categoryEn: source.categoryEn,
      extras: source.extras ?? {},
      workflowStatus: "draft",
      publishedAt: null,
    })
    .returning();

  redirect(adminPath(`/events/${row.id}/edit`));
}
