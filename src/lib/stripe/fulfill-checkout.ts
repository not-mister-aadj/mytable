import { eq, sql, and } from "drizzle-orm";
import type Stripe from "stripe";
import { bookingEvents, bookings, events } from "@/db/schema";
import type { Booking, Event } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { deliverBookingConfirmationEmail } from "@/lib/email/deliver-booking-confirmation";
import { onPaymentCompleted } from "@/lib/customers/hooks";
import { sendMetaCapiPurchase } from "@/lib/analytics/metaCapi";
import { splitPersonName } from "@/lib/analytics/metaCapiClient";
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
import { ensureAuthUserForEmail } from "@/lib/auth/ensure-auth-user-for-email";
import { captureCriticalError, captureCriticalMessage } from "@/lib/sentry/critical";

export type FulfillCheckoutOptions = {
  /** Skip blocking on Resend — confirmation page renders first, API poll sends email. */
  deferEmail?: boolean;
  /** Run CRM / Meta CAPI / PostHog after responding (confirmation page). */
  deferSideEffects?: boolean;
};

async function ensureAuthUserForBooking(booking: Booking): Promise<void> {
  try {
    await ensureAuthUserForEmail({
      email: booking.email,
      name: booking.customerName,
    });
  } catch (err) {
    console.error("[stripe fulfill] ensure auth user failed", err);
    captureCriticalError(err, {
      flow: "auth",
      step: "ensure_auth_user_after_payment",
      tags: { booking_id: booking.id },
    });
  }
}

async function runPostPaymentSideEffects(
  session: Stripe.Checkout.Session,
  updated: { booking: Booking; ev: Event },
  options?: FulfillCheckoutOptions,
): Promise<void> {
  const run = async () => {
    const db = getDb();

    await ensureAuthUserForBooking(updated.booking);

    try {
      await onPaymentCompleted({
        booking: updated.booking,
        event: updated.ev,
      });
    } catch (err) {
      console.error("[stripe fulfill] CRM hook failed", err);
    }

    const storedMeta = await loadCheckoutMetaContext(updated.booking.id);
    const nameParts = splitPersonName(updated.booking.customerName);
    const stripePhone = session.customer_details?.phone?.trim() || null;
    const capiSent = await sendMetaCapiPurchase({
      booking: updated.booking,
      event: updated.ev,
      userData: metaUserDataFromStoredContext(
        storedMeta,
        updated.booking.email,
        nameParts.firstName,
        {
          lastName: nameParts.lastName,
          phone: stripePhone,
          city: updated.ev.city,
          country: "nl",
        },
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
      price_per_seat: Math.round(
        updated.booking.amountCents / Math.max(1, updated.booking.seats),
      ) / 100,
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

    if (updated.booking.fromSundayTable) {
      void captureServerEvent(
        updated.booking.email,
        PostHogEvents.culinaryBookedWithin30dOfSunday,
        paymentProps,
      );
    }

    try {
      const { recordAffiliateCommissionForBooking } = await import(
        "@/lib/affiliate"
      );
      await recordAffiliateCommissionForBooking({
        bookingId: updated.booking.id,
        affiliateCode: updated.booking.affiliateCode,
        seats: updated.booking.seats,
      });
    } catch (err) {
      console.error("[stripe fulfill] affiliate commission failed", err);
    }

    try {
      const { recordMakerCommissionForBooking } = await import("@/lib/makers/server");
      await recordMakerCommissionForBooking(updated.booking.id);
    } catch (err) {
      console.error("[stripe fulfill] maker commission failed", err);
    }
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
  | "booking_not_found"
  /** Paid while the last seat went to someone else: refunded (full-sunday.ts). */
  | "sunday_full";

class AlreadyFulfilled extends Error {}
class AlreadyRefunded extends Error {}
class SundayFull extends Error {}

/** Mark booking paid, send confirmation email, then CRM/analytics — idempotent. */
export async function fulfillPaidCheckoutSession(
  session: Stripe.Checkout.Session,
  options?: FulfillCheckoutOptions,
): Promise<FulfillCheckoutResult> {
  // A membership Checkout (subscription mode) has its own fulfilment; this
  // path is reached from the pending-checkout sync and the return page.
  if (session.metadata?.kind === "membership") {
    const { fulfillMembershipCheckout } = await import("@/lib/membership/fulfill");
    const result = await fulfillMembershipCheckout(session);
    if (result.ok) return "fulfilled";
    return result.reason === "not_paid" ? "not_paid" : "missing_metadata";
  }

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
      await ensureAuthUserForBooking(existing);
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

    await ensureAuthUserForBooking(existing);
    return "already_paid";
  }

  // A seat from "Er is een plek vrij": room is made for it first (the Sunday
  // is full), and the booking joins the group with the gap.
  const seatOfferId = session.metadata?.seat_offer;
  if (seatOfferId) {
    const { claimSeatOffer } = await import("@/lib/seat-offer");
    await claimSeatOffer(seatOfferId, bookingId).catch((error) => console.error("[fulfill] claiming the seat offer failed:", error));
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  let updated: { booking: Booking; ev: Event };
  try {
    updated = await db.transaction(async (tx) => {
      // The booking first. A second fulfilment at the same moment (the
      // webhook next to the return page) waits on this row, then finds it
      // paid and changes nothing: no second seat counted, no second mail.
      const [booking] = await tx
        .update(bookings)
        .set({ paymentStatus: "paid", stripePaymentIntentId: paymentIntentId, stripeCheckoutSessionId: session.id })
        .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "pending")))
        .returning();
      if (!booking) {
        const [now] = await tx.select({ status: bookings.paymentStatus }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
        if (now?.status === "paid") throw new AlreadyFulfilled();
        if (now?.status === "refunded") throw new AlreadyRefunded();
        throw new Error("Booking already processed");
      }

      const [ev] = await tx
        .update(events)
        .set({ spotsSold: sql`${events.spotsSold} + ${existing.seats}`, updatedAt: new Date() })
        .where(sql`${events.id} = ${eventId} AND ${events.spotsSold} + ${existing.seats} <= ${events.capacity}`)
        .returning();
      if (!ev) throw new SundayFull();

      await tx.insert(bookingEvents).values({ bookingId, type: "payment_succeeded", payload: { sessionId: session.id } });
      return { booking, ev };
    });
  } catch (error) {
    if (error instanceof AlreadyFulfilled) return "already_paid";
    if (error instanceof AlreadyRefunded) return "sunday_full";
    if (error instanceof SundayFull) {
      // Paid for the last seat while someone else took it: money back.
      const [ev] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      if (ev) {
        const { refundFullSunday } = await import("@/lib/stripe/full-sunday");
        await refundFullSunday({ booking: existing, event: ev, paymentIntentId, sessionId: session.id });
      }
      captureCriticalMessage("Paid for a full Sunday: refunded", {
        flow: "payment",
        step: "booking_fulfill",
        tags: { session_id: session.id, booking_id: bookingId },
      });
      return "sunday_full";
    }
    throw error;
  }

  revalidateEventPaths(updated.ev);

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
    captureCriticalError(err, {
      flow: "payment",
      step: "fulfill_session_retrieve",
      tags: { session_id: sessionId },
    });
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
    captureCriticalError(err, {
      flow: "payment",
      step: "fulfill_unexpected",
      tags: { session_id: sessionId },
    });
    return null;
  }
}
