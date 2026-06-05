import { eq } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { formatDateTime } from "@/lib/event-display";
import { reservationCode } from "@/lib/booking-display";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { isUsableImageUrl, DEFAULT_EVENT_IMAGE } from "@/lib/image-settings";
import type { Locale } from "@/i18n/config";

export type BookingOutcomeSummary = {
  eventName: string;
  eventSlug: string;
  city: string;
  dateTime: string;
  imageUrl: string;
  amountCents?: number;
  currency?: string;
  seats?: number;
  reservationCode?: string;
};

export async function getBookingSummaryFromSession(
  sessionId: string,
  locale: Locale,
): Promise<BookingOutcomeSummary | null> {
  if (!isDbConfigured() || !isStripeConfigured()) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return null;

  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) return null;

  const name = locale === "nl" ? row.event.nameNl : row.event.nameEn;

  return {
    eventName: name,
    eventSlug: row.event.slug,
    city: row.event.city,
    dateTime: formatDateTime(
      new Date(row.event.startsAt),
      row.event.endsAt ? new Date(row.event.endsAt) : null,
      locale,
    ),
    imageUrl: isUsableImageUrl(row.event.imageUrl)
      ? row.event.imageUrl
      : DEFAULT_EVENT_IMAGE,
    amountCents: row.booking.amountCents,
    currency: row.booking.currency,
    seats: row.booking.seats,
    reservationCode: reservationCode(row.booking.id),
  };
}

export async function getEventSummaryBySlug(
  slug: string,
  locale: Locale,
): Promise<BookingOutcomeSummary | null> {
  if (!isDbConfigured()) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!row) return null;

  return {
    eventName: locale === "nl" ? row.nameNl : row.nameEn,
    eventSlug: row.slug,
    city: row.city,
    dateTime: formatDateTime(
      new Date(row.startsAt),
      row.endsAt ? new Date(row.endsAt) : null,
      locale,
    ),
    imageUrl: isUsableImageUrl(row.imageUrl) ? row.imageUrl : DEFAULT_EVENT_IMAGE,
  };
}
