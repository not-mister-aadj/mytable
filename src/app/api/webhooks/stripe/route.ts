import { NextResponse } from "next/server";
import { eq, sql, and } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { sendBookingConfirmationForPaidBooking } from "@/lib/email/sendBookingConfirmationEmail";
import { onPaymentCompleted, onPaymentFailed } from "@/lib/customers/hooks";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { hashEmail } from "@/lib/posthog/properties";
import { getStripe } from "@/lib/stripe";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const eventId = session.metadata?.event_id;

    if (!bookingId || !eventId) {
      return NextResponse.json({ received: true });
    }

    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ received: true });
    }

    if (existing.paymentStatus === "paid") {
      if (existing.confirmationEmailSentAt) {
        return NextResponse.json({ received: true });
      }

      const [ev] = await db
        .select()
        .from(events)
        .where(eq(events.id, existing.eventId))
        .limit(1);

      if (ev) {
        try {
          await sendBookingConfirmationForPaidBooking(existing, ev);
        } catch (emailErr) {
          console.error("[stripe webhook] email failed", emailErr);
        }
      }

      return NextResponse.json({ received: true });
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
          and(
            eq(bookings.id, bookingId),
            eq(bookings.paymentStatus, "pending"),
          ),
        )
        .returning();

      if (!booking) {
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

    await onPaymentCompleted({
      booking: updated.booking,
      event: updated.ev,
    });

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
    void captureServerEvent(
      updated.booking.email,
      PostHogEvents.bookingPaid,
      {
        ...paymentProps,
        amount_cents: updated.booking.amountCents,
        locale: updated.booking.locale,
      },
    );

    try {
      await sendBookingConfirmationForPaidBooking(updated.booking, updated.ev);
    } catch (emailErr) {
      console.error("[stripe webhook] email failed", emailErr);
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
