import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { getMaxSeatsPerOrder, getSiteUrl } from "@/lib/env";
import { onBookingCreated, onCheckoutStarted } from "@/lib/customers/hooks";
import {
  sendMetaCapiInitiateCheckout,
} from "@/lib/analytics/metaCapi";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { metaUserDataFromRequest } from "@/lib/analytics/metaCapiContext";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { getStripe, getCheckoutPaymentMethodTypes, isStripeConfigured } from "@/lib/stripe";
import type { Locale } from "@/i18n/config";

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.reset < now) {
    rateLimit.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Betalingen zijn nog niet geconfigureerd." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`checkout:${ip}`)) {
    return NextResponse.json({ error: "Te veel verzoeken." }, { status: 429 });
  }

  let body: {
    eventId?: string;
    seats?: number;
    email?: string;
    name?: string;
    locale?: string;
    dietaryNotes?: string;
    utm?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
    };
    meta?: {
      fbp?: string;
      fbc?: string;
      eventSourceUrl?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const eventId = body.eventId?.trim();
  const email = body.email?.trim().toLowerCase();
  const seats = Math.min(
    getMaxSeatsPerOrder(),
    Math.max(1, Number(body.seats) || 1),
  );
  const locale = (body.locale === "en" ? "en" : "nl") as Locale;

  if (!eventId || !email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Event en geldig e-mailadres zijn verplicht." },
      { status: 400 },
    );
  }

  if (!checkRateLimit(`checkout:event:${eventId}:${email}`, 5, 300_000)) {
    return NextResponse.json({ error: "Te veel pogingen." }, { status: 429 });
  }

  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.workflowStatus !== "published") {
    return NextResponse.json({ error: "Tafel niet beschikbaar." }, { status: 404 });
  }

  const spotsLeft = event.capacity - event.spotsSold;
  if (spotsLeft < seats) {
    return NextResponse.json({ error: "Niet genoeg plekken over." }, { status: 409 });
  }

  const amountCents = event.priceCents * seats;
  const [booking] = await db
    .insert(bookings)
    .values({
      eventId: event.id,
      email,
      customerName: body.name?.trim() || null,
      seats,
      amountCents,
      locale,
      dietaryNotes: body.dietaryNotes?.trim() || null,
      paymentStatus: "pending",
    })
    .returning();

  await onBookingCreated({ booking, event });

  const utm = body.utm ?? {};
  const metaContext = parseMetaTrackingContext(body.meta);
  if (
    utm.utm_source ||
    utm.utm_medium ||
    utm.utm_campaign ||
    utm.utm_content
  ) {
    await db.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "checkout_utm",
      payload: utm,
    });
  }

  if (metaContext.fbp || metaContext.fbc || metaContext.eventSourceUrl) {
    await db.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "checkout_meta_context",
      payload: metaContext,
    });
  }

  void sendMetaCapiInitiateCheckout({
    booking,
    event,
    userData: metaUserDataFromRequest(
      request,
      metaContext,
      booking.email,
      booking.customerName?.split(/\s+/)[0] ?? null,
    ),
  });

  const stripe = getStripe();
  const siteUrl = getSiteUrl();
  const productName =
    locale === "nl" ? event.nameNl : event.nameEn;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    locale: locale === "nl" ? "nl" : "en",
    payment_method_types: getCheckoutPaymentMethodTypes(event.currency),
    line_items: [
      {
        quantity: seats,
        price_data: {
          currency: event.currency.toLowerCase(),
          unit_amount: event.priceCents,
          product_data: {
            name: productName,
            description: `${event.city} · MyTable`,
          },
        },
      },
    ],
    metadata: {
      booking_id: booking.id,
      event_id: event.id,
    },
    success_url: `${siteUrl}/${locale}/boeking/bevestigd?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${locale}/boeking/geannuleerd?event=${event.slug}`,
  });

  await db
    .update(bookings)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(bookings.id, booking.id));

  const [bookingWithSession] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, booking.id))
    .limit(1);

  if (bookingWithSession) {
    await onCheckoutStarted({
      booking: bookingWithSession,
      event,
      stripeSessionId: session.id,
    });
  }

  void captureServerEvent(email, PostHogEvents.checkoutStarted, {
    event_id: event.id,
    event_slug: event.slug,
    event_type: event.experienceType,
    event_name: productName,
    city: event.city,
    seats,
    total_price: amountCents / 100,
    price_per_seat: event.priceCents / 100,
    stripe_session_id: session.id,
    language: locale,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Checkout mislukt." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, bookingId: booking.id });
}
