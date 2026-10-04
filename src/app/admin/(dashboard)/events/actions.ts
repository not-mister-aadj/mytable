"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { reconcileEventSpotsSold } from "@/lib/reconcile-spots-sold";
import { onBookingCancelled } from "@/lib/customers/hooks";
import { parseEventExtras, GIRLS_ONLY_ATMOSPHERE_TAG } from "@/lib/event-extras";
import { syncEventVenuesFromEvent } from "@/lib/event-venues";
import {
  formatEventSaveError,
  validateEventForm,
} from "@/lib/event-form-validation";
import { parseEventDateTimeLocal } from "@/lib/event-datetime-local";
import { generateEventSlug } from "@/lib/event-slug";
import {
  recordEventSlugRedirect,
  resolveUniqueEventSlug,
} from "@/lib/event-slug.server";
import { DEFAULT_EVENT_IMAGE, isUsableImageUrl } from "@/lib/image-settings";
import {
  DEFAULT_EXPERIENCE_TYPE,
  getExperienceTypeDefinition,
  isValidExperienceType,
} from "@/lib/experience-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { applyMembersOnlyDefault } from "@/lib/membership/early-access";
import { transferBooking } from "@/lib/booking-transfer";
import { redirect } from "next/navigation";
import { isSharedTableType } from "@/lib/event-concepts";
import { recordSeriesSkip } from "@/lib/jouw-tafel/series-server";

export type EventFormState = {
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
  const extras = {
    ...form.extras,
    atmosphereTags: (form.extras.atmosphereTags ?? []).filter(
      (t) => t !== GIRLS_ONLY_ATMOSPHERE_TAG,
    ),
  };

  return {
    city: form.city,
    startsAt: parseEventDateTimeLocal(form.startsAt),
    endsAt: form.endsAt ? parseEventDateTimeLocal(form.endsAt) : null,
    priceCents: Math.round(priceEuros * 100),
    capacity: Number.isFinite(capacity) ? capacity : 14,
    femaleOnly: false,
    imageUrl:
      extras.heroImage?.url ||
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
    extras: extras as Record<string, unknown>,
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
  const slug = await resolveUniqueEventSlug(
    db,
    generateEventSlug({
      nameNl: values.nameNl,
      city: values.city,
      startsAt: values.startsAt,
    }),
  );
  const [row] = await db
    .insert(events)
    .values({
      ...values,
      slug,
      workflowStatus: "draft",
    })
    .returning();
  await syncEventVenuesFromEvent(row);
  redirect(adminPath(`/events/${row.id}/edit?saved=1`));
}

async function applyEventUpdate(id: string, formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) {
    throw new Error("Database niet geconfigureerd");
  }
  const form = parseForm(formData);
  const values = toEventValues(form);
  const db = getDb();
  const [existing] = await db
    .select({ slug: events.slug, extras: events.extras, experienceType: events.experienceType })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  if (!existing) {
    throw new Error("Event niet gevonden");
  }
  // The form only knows the agenda formats: a Sunday Social or Sunday Table
  // edited here keeps its own type instead of turning into a wine tasting.
  const experienceType: string = isSharedTableType(existing.experienceType)
    ? existing.experienceType
    : values.experienceType;

  const nextSlug = await resolveUniqueEventSlug(
    db,
    generateEventSlug({
      nameNl: values.nameNl,
      city: values.city,
      startsAt: values.startsAt,
    }),
    id,
  );

  const [row] = await db
    .update(events)
    .set({ ...values, experienceType, slug: nextSlug })
    .where(eq(events.id, id))
    .returning();
  await syncEventVenuesFromEvent(row);

  if (existing.slug !== nextSlug) {
    await recordEventSlugRedirect(db, {
      fromSlug: existing.slug,
      toSlug: nextSlug,
      eventId: id,
    });
    revalidateEventPaths(existing.slug);
  }

  if (row.workflowStatus === "published") {
    // Out of "binnenkort" now: members get the first 48 hours.
    if (existing.extras?.comingSoon && !row.extras?.comingSoon) {
      await applyMembersOnlyDefault(row.id);
    }
    revalidateEventPaths(row);
  }
  return row;
}

async function persistUpdateEvent(id: string, formData: FormData) {
  await applyEventUpdate(id, formData);
  redirect(adminPath(`/events/${id}/edit?saved=1`));
}

export async function saveEventAction(id: string, formData: FormData) {
  await persistUpdateEvent(id, formData);
}

export async function createEventDirectAction(formData: FormData) {
  await persistNewEvent(formData);
}

export async function saveAndPublishEventAction(id: string, formData: FormData) {
  const row = await applyEventUpdate(id, formData);
  const db = getDb();
  const [published] = await db
    .update(events)
    .set({
      workflowStatus: "published",
      publishedAt: row.publishedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();
  if (published) {
    await applyMembersOnlyDefault(published.id);
    revalidateEventPaths(published);
  }
  redirect(adminPath(`/events/${id}/edit?published=1`));
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
  if (row) {
    await applyMembersOnlyDefault(row.id);
    revalidateEventPaths(row);
  }
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
  if (row) revalidateEventPaths(row);
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

  // A "Jouw tafel" series date that is deleted stays gone: the daily
  // series run never makes it again.
  if (event.seriesId && event.seriesDate) {
    await recordSeriesSkip(event.seriesId, event.seriesDate);
  }
  await db.delete(events).where(eq(events.id, id));
  if (event.workflowStatus === "published") {
    revalidateEventPaths(event);
  }
  redirect(adminPath("/events"));
}

export async function duplicateEventAction(id: string) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  const db = getDb();
  const [source] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!source) throw new Error("Event niet gevonden");

  const copyNameNl = source.nameNl.replace(/\s*\(copy\)\s*$/i, "").trim();
  const newSlug = await resolveUniqueEventSlug(
    db,
    generateEventSlug({
      nameNl: copyNameNl,
      city: source.city,
      startsAt: source.startsAt,
    }),
  );

  const sourceExtras = parseEventExtras(source.extras);
  const cleanedExtras = {
    ...sourceExtras,
    atmosphereTags: (sourceExtras.atmosphereTags ?? []).filter(
      (t) => t !== GIRLS_ONLY_ATMOSPHERE_TAG,
    ),
  };

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
      femaleOnly: false,
      experienceType: source.experienceType ?? "wine-tasting",
      mood: source.mood,
      imageUrl: source.imageUrl,
      nameNl: `${source.nameNl} (copy)`,
      nameEn: `${source.nameEn} (copy)`,
      taglineNl: source.taglineNl,
      taglineEn: source.taglineEn,
      categoryNl: source.categoryNl,
      categoryEn: source.categoryEn,
      extras: cleanedExtras as Record<string, unknown>,
      workflowStatus: "draft",
      publishedAt: null,
    })
    .returning();
  await syncEventVenuesFromEvent(row);

  redirect(adminPath(`/events/${row.id}/edit`));
}

export type BookingActionResult = { error: string | null };

/** Admin "Niet gekomen" on a booking (and its undo). For a member: first
 * time a warning mail, later a month without booking (see markNoShow). */
export async function markBookingNoShowAction(
  bookingId: string,
  undo = false,
): Promise<BookingActionResult & { notice?: string }> {
  const { user } = await requireAdmin();
  if (!isDbConfigured()) return { error: "Database niet geconfigureerd" };
  try {
    const { markNoShow, undoNoShow } = await import("@/lib/membership/no-show");
    if (undo) {
      const result = await undoNoShow({ bookingId, by: user.email ?? "admin" });
      return { error: result.ok ? null : (result.error ?? "Terugdraaien mislukt") };
    }
    const result = await markNoShow({ bookingId, by: user.email ?? "admin" });
    if (!result.ok) return { error: result.error };
    const notice = !result.outcome
      ? "Gemarkeerd als niet gekomen."
      : result.outcome.kind === "warning"
        ? `Lid: eerste keer, waarschuwingsmail ${result.mailed ? "verstuurd" : "NIET verstuurd"}.`
        : `Lid: kan een maand niet boeken, mail ${result.mailed ? "verstuurd" : "NIET verstuurd"}.`;
    return { error: null, notice };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Markeren mislukt" };
  }
}

export type TransferBookingResult = BookingActionResult;

export async function resendBookingConfirmationAction(
  bookingId: string,
): Promise<BookingActionResult> {
  await requireAdmin();
  if (!isDbConfigured()) {
    return { error: "Database niet geconfigureerd" };
  }

  try {
    const db = getDb();
    const [row] = await db
      .select({ booking: bookings, event: events })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!row) {
      return { error: "Boeking niet gevonden" };
    }

    if (row.booking.lifecycleStatus !== "active") {
      return { error: "Alleen actieve boekingen kunnen opnieuw worden gemaild" };
    }

    const { deliverBookingConfirmationEmail } = await import(
      "@/lib/email/deliver-booking-confirmation"
    );

    const result = await deliverBookingConfirmationEmail(
      row.booking,
      row.event,
      "admin-resend",
      { force: true },
    );
    if (!result.ok) {
      return { error: result.error };
    }
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "E-mail versturen mislukt.",
    };
  }
}

export async function removeBookingFromEventAction(
  bookingId: string,
  eventId: string,
): Promise<BookingActionResult> {
  await requireAdmin();
  if (!isDbConfigured()) {
    return { error: "Database niet geconfigureerd" };
  }

  const db = getDb();

  try {
    const slug = await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking) {
        throw new Error("Boeking niet gevonden");
      }
      if (booking.eventId !== eventId) {
        throw new Error("Boeking hoort niet bij deze tafel");
      }
      if (booking.paymentStatus !== "paid") {
        throw new Error("Alleen bevestigde tickets kunnen worden verwijderd");
      }
      if (booking.lifecycleStatus !== "active") {
        throw new Error("Deze boeking is niet meer actief op deze tafel");
      }

      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!event) {
        throw new Error("Tafel niet gevonden");
      }

      await tx.insert(bookingEvents).values({
        bookingId,
        type: "removed_by_admin",
        payload: {
          eventId,
          seats: booking.seats,
          email: booking.email,
        },
      });

      const [updatedEvent] = await tx
        .update(events)
        .set({
          spotsSold: sql`${events.spotsSold} - ${booking.seats}`,
          updatedAt: new Date(),
        })
        .where(
          sql`${events.id} = ${eventId} AND ${events.spotsSold} >= ${booking.seats}`,
        )
        .returning();

      if (!updatedEvent) {
        throw new Error("Kon bezetting niet bijwerken");
      }

      await tx
        .update(bookings)
        .set({ paymentStatus: "refunded", lifecycleStatus: "removed" })
        .where(eq(bookings.id, bookingId));

      return { slug: event.slug, booking, event };
    });

    if (slug.booking.customerId) {
      await onBookingCancelled({
        customerId: slug.booking.customerId,
        booking: slug.booking,
        event: slug.event,
      });
    }

    await reconcileEventSpotsSold([eventId]);
    revalidateEventPaths(slug.event);

    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Verwijderen mislukt. Probeer het opnieuw.",
    };
  }
}

export async function transferBookingToEventAction(
  bookingId: string,
  targetEventId: string,
): Promise<TransferBookingResult> {
  const { user } = await requireAdmin();
  if (!isDbConfigured()) {
    return { error: "Database niet geconfigureerd" };
  }

  try {
    await transferBooking({ bookingId, targetEventId, by: user.email ?? null });
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Verplaatsen mislukt. Probeer het opnieuw.",
    };
  }
}
