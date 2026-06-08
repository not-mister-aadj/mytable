import { eq, and } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { deliverBookingConfirmationEmail } from "@/lib/email/deliver-booking-confirmation";
import { isCheckoutPaymentSettled } from "@/lib/stripe/checkout-session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/** Retry confirmation email for a paid checkout session (confirmation page / poll API). */
export async function ensureConfirmationEmailForCheckoutSession(
  sessionId: string,
): Promise<void> {
  if (
    !sessionId.startsWith("cs_") ||
    !isDbConfigured() ||
    !isStripeConfigured()
  ) {
    return;
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[email] session retrieve for confirmation retry failed", err);
    return;
  }

  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
      ),
    )
    .limit(1);

  if (!row || row.booking.confirmationEmailSentAt) return;
  if (!isCheckoutPaymentSettled(session, row.booking.paymentStatus)) return;

  await deliverBookingConfirmationEmail(
    row.booking,
    row.event,
    "confirmation-page",
  );
}
