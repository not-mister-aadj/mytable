"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { reconcileEventSpotsSold } from "@/lib/reconcile-spots-sold";
import { buildBookingMovedEmailProps } from "@/lib/email/build-email-props";
import { sendBookingMovedEmail } from "@/lib/email/sendBookingMovedEmail";
import {
  onBookingCancelled,
  onBookingCreated,
  onBookingMoved,
} from "@/lib/customers/hooks";
import { parseEventExtras, resolveFemaleOnly } from "@/lib/event-extras";
import {
  formatEventSaveError,
  validateEventForm,
} from "@/lib/event-form-validation";
import { parseEventDateTimeLocal } from "@/lib/event-datetime-local";
import { generateEventSlug } from "@/lib/event-slug";
import { resolveUniqueEventSlug } from "@/lib/event-slug.server";
import { DEFAULT_EVENT_IMAGE, isUsableImageUrl } from "@/lib/image-settings";
import {
  DEFAULT_EXPERIENCE_TYPE,
  getExperienceTypeDefinition,
  isValidExperienceType,
} from "@/lib/experience-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

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

  return {
    city: form.city,
    startsAt: parseEventDateTimeLocal(form.startsAt),
    endsAt: form.endsAt ? parseEventDateTimeLocal(form.endsAt) : null,
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
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  if (!existing) {
    throw new Error("Event niet gevonden");
  }
  const [row] = await db
    .update(events)
    .set({ ...values, slug: existing.slug })
    .where(eq(events.id, id))
    .returning();
  if (row.workflowStatus === "published") {
    revalidateEventPaths(row.slug);
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
  if (published) revalidateEventPaths(published.slug);
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

  const copyNameNl = source.nameNl.replace(/\s*\(copy\)\s*$/i, "").trim();
  const newSlug = await resolveUniqueEventSlug(
    db,
    generateEventSlug({
      nameNl: copyNameNl,
      city: source.city,
      startsAt: source.startsAt,
    }),
  );

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

export type BookingActionResult = { error: string | null };

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
    revalidateEventPaths(slug.slug);

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

  const db = getDb();

  try {
    const slugs = await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking) {
        throw new Error("Boeking niet gevonden");
      }
      if (booking.paymentStatus !== "paid") {
        throw new Error("Alleen bevestigde betalingen kunnen worden verplaatst");
      }
      if (booking.lifecycleStatus !== "active") {
        throw new Error("Deze boeking is niet meer actief op deze tafel");
      }
      if (booking.eventId === targetEventId) {
        throw new Error("Kies een andere tafel");
      }

      const [sourceEvent] = await tx
        .select()
        .from(events)
        .where(eq(events.id, booking.eventId))
        .limit(1);
      const [targetEvent] = await tx
        .select()
        .from(events)
        .where(eq(events.id, targetEventId))
        .limit(1);

      if (!sourceEvent || !targetEvent) {
        throw new Error("Tafel niet gevonden");
      }
      if (targetEvent.workflowStatus === "cancelled") {
        throw new Error("Doeltafel is geannuleerd");
      }
      if (targetEvent.spotsSold + booking.seats > targetEvent.capacity) {
        throw new Error("Niet genoeg plekken op de doeltafel");
      }

      const transferredAt = new Date();

      const [newBooking] = await tx
        .insert(bookings)
        .values({
          eventId: targetEventId,
          customerId: booking.customerId,
          email: booking.email,
          customerName: booking.customerName,
          seats: booking.seats,
          amountCents: booking.amountCents,
          currency: booking.currency,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          paymentStatus: "paid",
          locale: booking.locale,
          dietaryNotes: booking.dietaryNotes,
          seatingPreference: booking.seatingPreference,
          adminNotes: booking.adminNotes,
          confirmationEmailSentAt: booking.confirmationEmailSentAt,
          lifecycleStatus: "active",
          transferredFromBookingId: booking.id,
          transferredAt,
          transferredBy: user.email ?? undefined,
        })
        .returning();

      if (!newBooking) {
        throw new Error("Kon nieuwe boeking niet aanmaken");
      }

      await tx
        .update(bookings)
        .set({
          lifecycleStatus: "transferred",
          transferredToEventId: targetEventId,
          transferredToBookingId: newBooking.id,
          transferredAt,
          transferredBy: user.email ?? undefined,
        })
        .where(eq(bookings.id, bookingId));

      await tx.insert(bookingEvents).values([
        {
          bookingId,
          type: "transferred",
          payload: {
            fromEventId: sourceEvent.id,
            toEventId: targetEventId,
            toBookingId: newBooking.id,
            by: user.email,
          },
        },
        {
          bookingId: newBooking.id,
          type: "transferred_in",
          payload: {
            fromEventId: sourceEvent.id,
            fromBookingId: bookingId,
            by: user.email,
          },
        },
      ]);

      return {
        sourceSlug: sourceEvent.slug,
        targetSlug: targetEvent.slug,
        eventIds: [sourceEvent.id, targetEventId] as const,
        newBooking,
        sourceEvent,
        targetEvent,
        customerId: booking.customerId,
        sourceBookingId: bookingId,
      };
    });

    if (slugs.customerId) {
      await onBookingMoved({
        customerId: slugs.customerId,
        fromEvent: slugs.sourceEvent,
        toEvent: slugs.targetEvent,
        fromBookingId: slugs.sourceBookingId,
        toBookingId: slugs.newBooking.id,
        by: user.email,
      });
    } else {
      const customerId = await onBookingCreated({
        booking: slugs.newBooking,
        event: slugs.targetEvent,
      });
      await onBookingMoved({
        customerId,
        fromEvent: slugs.sourceEvent,
        toEvent: slugs.targetEvent,
        fromBookingId: slugs.sourceBookingId,
        toBookingId: slugs.newBooking.id,
        by: user.email,
      });
    }

    await reconcileEventSpotsSold([...slugs.eventIds]);
    revalidateEventPaths(slugs.sourceSlug);
    revalidateEventPaths(slugs.targetSlug);

    try {
      const movedProps = buildBookingMovedEmailProps(
        slugs.newBooking,
        slugs.sourceEvent,
        slugs.targetEvent,
      );
      await sendBookingMovedEmail(movedProps);
    } catch (emailErr) {
      console.error("[transfer booking] moved email failed", emailErr);
    }

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
