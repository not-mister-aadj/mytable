import { eq } from "drizzle-orm";
import type { Booking, Event } from "@/db/schema";
import { bookings, customers } from "@/db/schema";
import { getDb } from "@/db/index";
import { logCustomerActivity } from "@/lib/customers/activities";
import { recalculateCustomerStats } from "@/lib/customers/stats";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { captureServerEvent, identifyServerPerson } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { hashEmail } from "@/lib/posthog/properties";

function eventLabel(event: Event, locale = "nl"): string {
  return locale === "en" ? event.nameEn : event.nameNl;
}

export async function attachCustomerToBooking(
  bookingId: string,
  customerId: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(bookings)
    .set({ customerId })
    .where(eq(bookings.id, bookingId));
}

export async function onBookingCreated(input: {
  booking: Booking;
  event: Event;
}): Promise<string> {
  const { booking, event } = input;
  const { id: customerId } = await upsertCustomerFromEmail({
    email: booking.email,
    customerName: booking.customerName,
    language: booking.locale,
    preferredCity: event.city,
  });

  await attachCustomerToBooking(booking.id, customerId);

  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.bookingCreated,
    title: "Boeking gestart",
    description: `${eventLabel(event, booking.locale)} · ${event.city}`,
    metadata: {
      bookingId: booking.id,
      eventId: event.id,
      seats: booking.seats,
    },
  });

  await recalculateCustomerStats(customerId);
  return customerId;
}

export async function onCheckoutStarted(input: {
  booking: Booking;
  event: Event;
  stripeSessionId: string;
}): Promise<void> {
  const customerId = input.booking.customerId ?? (await onBookingCreated(input));

  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.checkoutStarted,
    title: "Checkout gestart",
    description: `${eventLabel(input.event, input.booking.locale)} · ${input.event.city}`,
    metadata: {
      bookingId: input.booking.id,
      stripeSessionId: input.stripeSessionId,
    },
  });

  await recalculateCustomerStats(customerId);
}

export async function onPaymentCompleted(input: {
  booking: Booking;
  event: Event;
}): Promise<void> {
  let customerId = input.booking.customerId;
  if (!customerId) {
    customerId = await onBookingCreated(input);
  }

  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.paymentCompleted,
    title: "Betaling voltooid",
    description: `${eventLabel(input.event, input.booking.locale)} · ${input.booking.seats} plaatsen`,
    metadata: {
      bookingId: input.booking.id,
      amountCents: input.booking.amountCents,
      city: input.event.city,
      eventType: input.event.experienceType,
    },
  });

  await recalculateCustomerStats(customerId);

  const [customer] = await getDb()
    .select({
      paidBookingsCount: customers.paidBookingsCount,
      totalBookings: customers.totalBookings,
      favoriteCity: customers.favoriteCity,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  void identifyServerPerson(customerId, {
    email_hash: hashEmail(input.booking.email),
    preferred_city: input.event.city,
    total_bookings: customer?.totalBookings ?? 0,
    paid_bookings_count: customer?.paidBookingsCount ?? 0,
  });

  void captureServerEvent(customerId, PostHogEvents.customerUpdated, {
    email_hash: hashEmail(input.booking.email),
    preferred_city: input.event.city,
    paid_bookings_count: customer?.paidBookingsCount ?? 0,
    total_bookings: customer?.totalBookings ?? 0,
  });
}

export async function onPaymentFailed(input: {
  booking: Booking;
  event: Event;
  reason: string;
}): Promise<void> {
  let customerId = input.booking.customerId;
  if (!customerId) {
    customerId = await onBookingCreated(input);
  }

  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.paymentFailed,
    title: "Betaling mislukt",
    description: `${eventLabel(input.event, input.booking.locale)} · ${input.reason}`,
    metadata: {
      bookingId: input.booking.id,
      reason: input.reason,
    },
  });

  await recalculateCustomerStats(customerId);
}

export async function onBookingMoved(input: {
  customerId: string;
  fromEvent: Event;
  toEvent: Event;
  fromBookingId: string;
  toBookingId: string;
  by?: string | null;
}): Promise<void> {
  await logCustomerActivity({
    customerId: input.customerId,
    type: CustomerActivityTypes.bookingMoved,
    title: "Boeking verplaatst",
    description: `${input.fromEvent.city} → ${input.toEvent.city}`,
    metadata: {
      fromBookingId: input.fromBookingId,
      toBookingId: input.toBookingId,
      fromEventId: input.fromEvent.id,
      toEventId: input.toEvent.id,
      by: input.by ?? null,
    },
  });

  await recalculateCustomerStats(input.customerId);
}

export async function onBookingCancelled(input: {
  customerId: string;
  booking: Booking;
  event: Event;
}): Promise<void> {
  await logCustomerActivity({
    customerId: input.customerId,
    type: CustomerActivityTypes.bookingCancelled,
    title: "Boeking geannuleerd",
    description: `${eventLabel(input.event, input.booking.locale)} · ${input.event.city}`,
    metadata: { bookingId: input.booking.id },
  });

  await recalculateCustomerStats(input.customerId);
}

export async function onWaitlistJoined(input: {
  email: string;
  city: string;
  locale: string;
  waitlistId: string;
}): Promise<string> {
  const { id: customerId } = await upsertCustomerFromEmail({
    email: input.email,
    language: input.locale,
    preferredCity: input.city,
  });

  const db = getDb();
  const { waitlistSignups } = await import("@/db/schema");
  await db
    .update(waitlistSignups)
    .set({ customerId })
    .where(eq(waitlistSignups.id, input.waitlistId));

  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.waitlistJoined,
    title: "Wachtlijst",
    description: `Aangemeld voor ${input.city}`,
    metadata: { city: input.city, waitlistId: input.waitlistId },
  });

  await recalculateCustomerStats(customerId);
  return customerId;
}

export async function onEmailSent(input: {
  customerId: string;
  subject: string;
  bookingId?: string;
}): Promise<void> {
  await logCustomerActivity({
    customerId: input.customerId,
    type: CustomerActivityTypes.emailSent,
    title: "E-mail verstuurd",
    description: input.subject,
    metadata: { bookingId: input.bookingId ?? null },
  });
}

export async function onNoteAdded(input: {
  customerId: string;
  notePreview: string;
}): Promise<void> {
  await logCustomerActivity({
    customerId: input.customerId,
    type: CustomerActivityTypes.noteAdded,
    title: "Notitie bijgewerkt",
    description: input.notePreview.slice(0, 120),
  });
}
