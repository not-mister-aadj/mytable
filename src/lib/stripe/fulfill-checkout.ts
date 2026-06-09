import { eq, sql, and } from "drizzle-orm";
import type Stripe from "stripe";
import { bookingEvents, bookings, events } from "@/db/schema";
import type { Booking, Event } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { deliverBookingConfirmationEmail } from "@/lib/email/deliver-booking-confirmation";
import { onPaymentCompleted } from "@/lib/customers/hooks";
import { sendMetaCapiPurchase } from "@/lib/analytics/metaCapi";
import { metaPurchaseEventId } from "@/lib/analytics/metaIds";
import {
  loadCheckoutMetaContext,
  metaUserDataFromStoredContext,
} from "@/lib/analytics/metaCapiContext";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { hashEmail } from "@/lib/posthog/properties";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { isCheckoutPaymentSettled } from "@/lib/stripe/checkout-session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export type FulfillCheckoutOptions = {
  /** Skip blocking on Resend — confirmation page renders first, API poll sends email. */
  deferEmail?: boolean;
  /** Run CRM / Meta CAPI / PostHog after responding (confirmation page). */
  deferSideEffects?: boolean;
};

async function runPostPaymentSideEffects(
  session: Stripe.Checkout.Session,
  updated: { booking: Booking; ev: Event },
  options?: FulfillCheckoutOptions,
): Promise<void> {
  const run = async () => {
    const db = getDb();

    try {
      await onPaymentCompleted({
        booking: updated.booking,
        event: updated.ev,
      });
    } catch (err) {
      console.error("[stripe fulfill] CRM hook failed", err);
    }

    const storedMeta = await loadCheckoutMetaContext(updated.booking.id);
    const capiSent = await sendMetaCapiPurchase({
      booking: updated.booking,
      event: updated.ev,
      userData: metaUserDataFromStoredContext(
        storedMeta,
        updated.booking.email,
        updated.booking.customerName?.split(/\s+/)[0] ?? null,
      ),
    });
    if (capiSent) {
      await db.insert(bookingEvents).values({
        bookingId: updated.booking.id,
        type: "meta_capi_purchase",
        payload: {
          event_id: metaPurchaseEventId(updated.booking.id),
        },
      });
    }

    const priorPaid = await countPriorPaidBookings(
      updated.booking.email,
      updated.booking.id,
    );
    const paymentProps = {
      booking_id: updated.booking.id,
      event_id: updated.ev.id,
      event_slug: updated.ev.slug,
      event_type: updated.ev.experienceType,
      city: updated.ev.city,
      seats: updated.booking.seats,
      total_paid: updated.booking.amountCents / 100,
      price_per_seat: updated.ev.priceCents / 100,
      stripe_session_id: session.id,
      is_first_booking: priorPaid === 0,
      customer_email_hash: hashEmail(updated.booking.email),
      language: updated.booking.locale,
      payment_method: session.payment_method_types?.[0] ?? null,
    };

    void captureServerEvent(
      updated.booking.email,
      PostHogEvents.paymentCompleted,
      paymentProps,
    );
    void captureServerEvent(updated.booking.email, PostHogEvents.bookingPaid, {
      ...paymentProps,
      amount_cents: updated.booking.amountCents,
      locale: updated.booking.locale,
    });
  };

  if (options?.deferSideEffects) {
    void run();
    return;
  }

  await run();
}

async function deliverConfirmationEmail(
  booking: Booking,
  event: Event,
  context: string,
  options?: FulfillCheckoutOptions,
): Promise<void> {
  if (options?.deferEmail) {
    void deliverBookingConfirmationEmail(booking, event, context);
    return;
  }
  await deliverBookingConfirmationEmail(booking, event, context);
}

async function countPriorPaidBookings(
  email: string,
  excludeBookingId: string,
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.email, email),
        eq(bookings.paymentStatus, "paid"),
        sql`${bookings.id} != ${excludeBookingId}`,
      ),
    );
  return rows.length;
}

export type FulfillCheckoutResult =
  | "fulfilled"
  | "already_paid"
  | "not_paid"
  | "missing_metadata"
  | "booking_not_found";

/** Mark booking paid, send confirmation email, then CRM/analytics — idempotent. */
export async function fulfillPaidCheckoutSession(
  session: Stripe.Checkout.Session,
  options?: FulfillCheckoutOptions,
): Promise<FulfillCheckoutResult> {
  const bookingId = session.metadata?.booking_id;
  const eventId = session.metadata?.event_id;

  if (!bookingId || !eventId) {
    return "missing_metadata";
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!existing) {
    return "booking_not_found";
  }

  if (!isCheckoutPaymentSettled(session, existing.paymentStatus)) {
    return "not_paid";
  }

  if (existing.paymentStatus === "paid") {
    if (existing.confirmationEmailSentAt) {
      return "already_paid";
    }

    const [ev] = await db
      .select()
      .from(events)
      .where(eq(events.id, existing.eventId))
      .limit(1);

    if (ev) {
      await deliverConfirmationEmail(existing, ev, "catch-up", options);
    }

    return "already_paid";
  }

  const updated = await db.transaction(async (tx) => {
    const [ev] = await tx
      .update(events)
      .set({
        spotsSold: sql`${events.spotsSold} + ${existing.seats}`,
        updatedAt: new Date(),
      })
      .where(
        sql`${events.id} = ${eventId} AND ${events.spotsSold} + ${existing.seats} <= ${events.capacity}`,
      )
      .returning();

    if (!ev) {
      throw new Error("Capacity exceeded");
    }

    const [booking] = await tx
      .update(bookings)
      .set({
        paymentStatus: "paid",
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        stripeCheckoutSessionId: session.id,
      })
      .where(
        and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "pending")),
      )
      .returning();

    if (!booking) {
      const [paidBooking] = await tx
        .select()
        .from(bookings)
        .where(
          and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "paid")),
        )
        .limit(1);

      if (paidBooking) {
        const [paidEvent] = await tx
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);
        if (paidEvent) {
          return { booking: paidBooking, ev: paidEvent };
        }
      }

      throw new Error("Booking already processed");
    }

    await tx.insert(bookingEvents).values({
      bookingId,
      type: "payment_succeeded",
      payload: { sessionId: session.id },
    });

    return { booking, ev };
  });

  revalidateEventPaths(updated.ev.slug);

  await deliverConfirmationEmail(
    updated.booking,
    updated.ev,
    "confirmation",
    options,
  );

  await runPostPaymentSideEffects(session, updated, options);

  return "fulfilled";
}

/** Fallback when the Stripe webhook is delayed or missed (confirmation page / poll API). */
export async function tryFulfillCheckoutSession(
  sessionId: string,
  options?: FulfillCheckoutOptions,
): Promise<FulfillCheckoutResult | null> {
  if (!sessionId.startsWith("cs_") || !isDbConfigured() || !isStripeConfigured()) {
    return null;
  }

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[stripe fulfill] session retrieve failed", err);
    return null;
  }

  if (!isCheckoutPaymentSettled(session)) {
    return "not_paid";
  }

  return fulfillPaidCheckoutSession(session, options);
}

/** Never throw — safe for the confirmation page shell. */
export async function tryFulfillCheckoutSessionSafe(
  sessionId: string,
  options?: FulfillCheckoutOptions,
): Promise<FulfillCheckoutResult | null> {
  try {
    return await tryFulfillCheckoutSession(sessionId, options);
  } catch (err) {
    console.error("[stripe fulfill] unexpected failure", err);
    return null;
  }
}
