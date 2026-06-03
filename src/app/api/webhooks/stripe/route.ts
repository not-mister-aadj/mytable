import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { getStripe } from "@/lib/stripe";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { sendBookingConfirmationEmail } from "@/lib/email";

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

    if (!existing || existing.paymentStatus === "paid") {
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
        .where(eq(bookings.id, bookingId))
        .returning();

      await tx.insert(bookingEvents).values({
        bookingId,
        type: "payment_succeeded",
        payload: { sessionId: session.id },
      });

      return { booking, ev };
    });

    revalidateEventPaths(updated.ev.slug);

    try {
      await sendBookingConfirmationEmail({
        booking: updated.booking,
        event: updated.ev,
      });
    } catch (emailErr) {
      console.error("[stripe webhook] email failed", emailErr);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await db
        .update(bookings)
        .set({ paymentStatus: "failed" })
        .where(eq(bookings.id, bookingId));
    }
  }

  return NextResponse.json({ received: true });
}
