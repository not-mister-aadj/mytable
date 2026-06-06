import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { onPaymentFailed } from "@/lib/customers/hooks";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { getStripe } from "@/lib/stripe";
import { fulfillPaidCheckoutSession } from "@/lib/stripe/fulfill-checkout";
import { isCheckoutPaymentSettled } from "@/lib/stripe/checkout-session";

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook niet geconfigureerd" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: import("stripe").Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    if (isCheckoutPaymentSettled(session)) {
      const result = await fulfillPaidCheckoutSession(session);
      if (result === "not_paid") {
        console.info(
          "[stripe webhook] checkout complete but payment not settled yet",
          session.id,
        );
      }
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const eventId = session.metadata?.event_id;
    if (bookingId) {
      const [booking] = await db
        .update(bookings)
        .set({ paymentStatus: "failed" })
        .where(
          and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "pending")),
        )
        .returning();

      if (booking && eventId) {
        const [ev] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (ev) {
          await onPaymentFailed({
            booking,
            event: ev,
            reason: "async_payment_failed",
          });

          void captureServerEvent(booking.email, PostHogEvents.paymentFailed, {
            event_id: ev.id,
            event_slug: ev.slug,
            event_type: ev.experienceType,
            city: ev.city,
            seats: booking.seats,
            attempted_amount: booking.amountCents / 100,
            failure_reason: "async_payment_failed",
            stripe_session_id: session.id,
            language: booking.locale,
          });
        }
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const eventId = session.metadata?.event_id;
    if (bookingId) {
      const [booking] = await db
        .update(bookings)
        .set({ paymentStatus: "failed" })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (booking && eventId) {
        const [ev] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (ev) {
          await onPaymentFailed({
            booking,
            event: ev,
            reason: "session_expired",
          });

          void captureServerEvent(booking.email, PostHogEvents.paymentFailed, {
            event_id: ev.id,
            event_slug: ev.slug,
            event_type: ev.experienceType,
            city: ev.city,
            seats: booking.seats,
            attempted_amount: booking.amountCents / 100,
            failure_reason: "session_expired",
            stripe_session_id: session.id,
            language: booking.locale,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
