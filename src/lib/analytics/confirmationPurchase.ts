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

/**
 * The booking a Checkout session pays for, and what was paid when that is
 * not the booking's own amount. A single seat: metadata.booking_id. "Elke
 * zondag" (a membership Checkout with this Sunday's seat in it): the seat's
 * booking, at what the first month cost, so it counts as a purchase too.
 */
export function purchaseRefOfSession(session: {
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
}): { bookingId: string; paidCents: number | null } | null {
  const md = session.metadata ?? {};
  if (md.booking_id) return { bookingId: md.booking_id, paidCents: null };
  if (md.kind === "membership" && md.source === "booking" && md.member_booking_id) {
    return { bookingId: md.member_booking_id, paidCents: session.amount_total ?? null };
  }
  return null;
}

export async function getConfirmationPurchase(
  sessionId: string,
  locale: Locale,
): Promise<ConfirmationPurchaseData | null> {
  if (!isDbConfigured() || !isStripeConfigured()) return null;

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[confirmation purchase] session retrieve failed", err);
    return null;
  }

  const ref = purchaseRefOfSession(session);
  if (!ref) {
    return null;
  }
  const bookingId = ref.bookingId;

  const sessionReady =
    session.status === "complete" || session.payment_status === "paid";

  if (!sessionReady) {
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
    value: (ref.paidCents ?? row.booking.amountCents) / 100,
    currency: row.booking.currency.toUpperCase(),
    contentName: locale === "en" ? row.event.nameEn : row.event.nameNl,
    experienceType: row.event.experienceType ?? DEFAULT_EXPERIENCE_TYPE,
    city: row.event.city,
    seats: row.booking.seats,
    pendingPayment: !settled,
  };
}
