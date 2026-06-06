import { eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { isCheckoutPaymentSettled } from "@/lib/stripe/checkout-session";

/** Serializable purchase payload for conversion tags on the confirmation page. */
export type ConfirmationPurchaseData = {
  bookingId: string;
  eventId: string;
  value: number;
  currency: string;
  contentName: string;
  experienceType: string;
  city: string;
  seats: number;
  /** iDEAL/Bancontact: browser conversion fires; server-side tags may wait for settlement */
  pendingPayment: boolean;
};

export async function getConfirmationPurchase(
  sessionId: string,
  locale: Locale,
): Promise<ConfirmationPurchaseData | null> {
  if (!isDbConfigured() || !isStripeConfigured()) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const bookingId = session.metadata?.booking_id;

  if (!bookingId || session.status !== "complete") {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) return null;

  const settled = isCheckoutPaymentSettled(session, row.booking.paymentStatus);

  return {
    bookingId: row.booking.id,
    eventId: row.event.id,
    value: row.booking.amountCents / 100,
    currency: row.booking.currency.toUpperCase(),
    contentName: locale === "en" ? row.event.nameEn : row.event.nameNl,
    experienceType: row.event.experienceType ?? DEFAULT_EXPERIENCE_TYPE,
    city: row.event.city,
    seats: row.booking.seats,
    pendingPayment: !settled,
  };
}
