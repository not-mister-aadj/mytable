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
import {
  fulfillMembershipCheckout,
  invoiceSubscriptionId,
  isMembershipCheckout,
  syncMembershipSubscription,
} from "@/lib/membership/fulfill";
import {
  captureCriticalError,
  captureCriticalMessage,
} from "@/lib/sentry/critical";

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    captureCriticalMessage("Stripe webhook missing signature or secret", {
      flow: "payment",
      step: "stripe_webhook_config",
    });
    return NextResponse.json({ error: "Webhook niet geconfigureerd" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: import("stripe").Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    // Often probe traffic — log only; do not page on every bad signature.
    console.error("[stripe webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  // Sunday Table membership (subscription mode Checkout, subscription and
  // invoice events). A failure answers 500 so Stripe retries; everything in
  // there is idempotent.
  const membershipResponse = await handleMembershipEvent(event);
  if (membershipResponse) return membershipResponse;

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;

    if (isCheckoutPaymentSettled(session)) {
      try {
        const result = await fulfillPaidCheckoutSession(session);
        if (result === "not_paid") {
          console.info(
            "[stripe webhook] checkout complete but payment not settled yet",
            session.id,
          );
        } else if (
          result === "missing_metadata" ||
          result === "booking_not_found"
        ) {
          captureCriticalMessage(`Stripe fulfill failed: ${result}`, {
            flow: "payment",
            step: "booking_fulfill",
            tags: {
              stripe_event: event.type,
              session_id: session.id,
              result,
            },
          });
        }
      } catch (err) {
        console.error("[stripe webhook] booking fulfill", err);
        captureCriticalError(err, {
          flow: "payment",
          step: "booking_fulfill",
          tags: {
            stripe_event: event.type,
            session_id: session.id,
          },
        });
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

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

const INVOICE_EVENTS = new Set(["invoice.paid", "invoice.payment_failed"]);

async function handleMembershipEvent(
  event: import("stripe").Stripe.Event,
): Promise<NextResponse | null> {
  try {
    if (event.type.startsWith("checkout.session.")) {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      if (!isMembershipCheckout(session)) return null;
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const result = await fulfillMembershipCheckout(session);
        if (!result.ok && result.reason !== "not_paid") {
          captureCriticalMessage(`Membership fulfil skipped: ${result.reason}`, {
            flow: "payment",
            step: "membership_fulfill",
            tags: { session_id: session.id, stripe_event: event.type },
          });
        }
      } else if (
        event.type === "checkout.session.expired" ||
        event.type === "checkout.session.async_payment_failed"
      ) {
        const bookingId = session.metadata?.member_booking_id;
        if (bookingId) {
          await getDb()
            .update(bookings)
            .set({ paymentStatus: "failed" })
            .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "pending")));
        }
      }
      return NextResponse.json({ received: true });
    }

    if (SUBSCRIPTION_EVENTS.has(event.type)) {
      const sub = event.data.object as import("stripe").Stripe.Subscription;
      if (sub.metadata?.kind !== "membership") return null;
      await syncMembershipSubscription(sub.id);
      return NextResponse.json({ received: true });
    }

    if (INVOICE_EVENTS.has(event.type)) {
      const invoice = event.data.object as import("stripe").Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (!subscriptionId) return null;
      await syncMembershipSubscription(subscriptionId);
      return NextResponse.json({ received: true });
    }
  } catch (err) {
    console.error("[stripe webhook] membership", err);
    captureCriticalError(err, {
      flow: "payment",
      step: "membership_webhook",
      tags: { stripe_event: event.type, event_id: event.id },
    });
    return NextResponse.json({ error: "membership handling failed" }, { status: 500 });
  }
  return null;
}
