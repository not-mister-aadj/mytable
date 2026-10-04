import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { getSiteUrl } from "@/lib/env";
import { onBookingCreated, onCheckoutStarted } from "@/lib/customers/hooks";
import {
  sendMetaCapiInitiateCheckout,
} from "@/lib/analytics/metaCapi";
import { splitPersonName } from "@/lib/analytics/metaCapiClient";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import {
  metaUserDataFromRequest,
  withRequestClientHints,
} from "@/lib/analytics/metaCapiContext";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { isEventClosedForBooking } from "@/lib/event-visibility";
import {
  isEnglishOpenForSundayTable,
  isTableLanguagePreference,
} from "@/lib/booking-table-language";
import {
  computeTierPrice,
  isBookingTier,
  MIN_BOOKING_SEATS,
  resolveSeatsForTier,
  resolveSundayTableSeats,
  seatingForTier,
  tierForSeats,
} from "@/lib/booking-tiers";
import {
  MEDIA_MARKETING_CONSENT_EVENT,
  MEDIA_MARKETING_CONSENT_VERSION,
} from "@/lib/media-marketing-consent";
import {
  ensurePriorityListSignup,
  PRIORITY_LIST_OPT_IN_EVENT,
} from "@/lib/priority-list-enrollment";
import { getStripe, getCheckoutPaymentMethodTypes, isStripeConfigured } from "@/lib/stripe";
import { captureCriticalError } from "@/lib/sentry/critical";
import type { Locale } from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { getRunningMembershipForUser, membershipSnapshot } from "@/lib/membership/data";
import {
  earlyAccessAllows,
  memberBookingDecision,
  type MemberBookingDecision,
} from "@/lib/membership/logic";
import { bookAsMember } from "@/lib/membership/member-checkout";

/** "zondag 25 oktober 14:00" for the early-access message. */
function openFromLabel(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
import { JOUW_TAFEL_CHECKOUT_SOURCE, resolveSeatPriceCents } from "@/lib/jouw-tafel/logic";
import { isJouwTafelType, isSharedTableType, isSundaySocialType } from "@/lib/event-concepts";

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

/** Keeps only known attribution keys with short string values, so the
 * `checkout_utm` booking event can't be filled with arbitrary client data. */
function cleanAttribution(
  raw: unknown,
): Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "ref", string>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "ref", string>> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"] as const) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 100);
  }
  return out;
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
    pricingTier?: string;
    email?: string;
    name?: string;
    locale?: string;
    dietaryNotes?: string;
    seatingPreference?: string;
    tableLanguagePreference?: string;
    joinPriorityList?: boolean;
    affiliateCode?: string;
    referralCode?: string;
    fromSundayTable?: boolean;
    /** "jouw-tafel" from the funnel: its own seat price (see
     * resolveSeatPriceCents). Anything else: the event's price. */
    source?: string;
    utm?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      ref?: string;
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
  const customerName = body.name?.trim();
  const locale = (body.locale === "en" ? "en" : "nl") as Locale;

  if (!eventId || !email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Event en geldig e-mailadres zijn verplicht." },
      { status: 400 },
    );
  }

  if (!customerName) {
    return NextResponse.json(
      {
        error:
          locale === "en" ? "Name is required." : "Naam is verplicht.",
      },
      { status: 400 },
    );
  }

  const tableLanguagePreference = isTableLanguagePreference(
    body.tableLanguagePreference,
  )
    ? body.tableLanguagePreference
    : "both_fine";

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

  // Shown in the agenda but not on sale yet: the date page offers "notify
  // me" instead of a ticket, and a direct request must not get round that.
  if (event.extras?.comingSoon) {
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Tickets for this table are not on sale yet."
            : "Aanmelden voor deze tafel is nog niet open.",
      },
      { status: 409 },
    );
  }

  if (isEventClosedForBooking(event.startsAt)) {
    return NextResponse.json(
      {
        error:
          locale === "en" ? "Bookings closed." : "Boekingen gesloten.",
      },
      { status: 409 },
    );
  }

  // Sunday Social and the "Jouw tafel" Sunday Table seat strangers at one
  // shared table (max 2 tickets, no "bring your own party" minimum).
  // Everything else keeps the existing tier system (min 2, own-table
  // bookings). Memberships and the €15 seat belong to Sunday Table only.
  const isSundayTable = isSharedTableType(event.experienceType);
  const isJouwTafel = isJouwTafelType(event.experienceType);

  // The date page only offers a ticket for "English" on tables that can seat
  // English speakers. Guard it here too, so nobody who only speaks English
  // ends up at a Dutch-speaking table. Not for the jouw-tafel funnel: there
  // everyone can always book, and tables are matched by hand afterwards.
  if (
    isSundaySocialType(event.experienceType) &&
    !isEnglishOpenForSundayTable(event.id) &&
    tableLanguagePreference === "prefer_english"
  ) {
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "This table is held in Dutch. English-speaking tables are coming soon."
            : "Deze tafel is in het Nederlands. Engelstalige tafels komen binnenkort.",
      },
      { status: 400 },
    );
  }

  // Members (Sunday Table): own seat included, a guest at the member price,
  // and they book first. Everyone else waits until members_only_until.
  let memberDecision: MemberBookingDecision = { kind: "non_member" };
  let runningMembership: Awaited<ReturnType<typeof getRunningMembershipForUser>> = null;
  const signedInUser = isJouwTafel ? await getMemberUser() : null;
  if (signedInUser?.email) {
    runningMembership = await getRunningMembershipForUser(signedInUser.id);
    memberDecision = memberBookingDecision(membershipSnapshot(runningMembership), event.startsAt);
  }

  if (isJouwTafel && memberDecision.kind === "blocked") {
    return NextResponse.json(
      {
        code: "member_blocked",
        until: memberDecision.until.toISOString(),
        error:
          locale === "en"
            ? `You can book again from ${openFromLabel(memberDecision.until, locale)}.`
            : `Je kunt weer boeken vanaf ${openFromLabel(memberDecision.until, locale)}.`,
      },
      { status: 409 },
    );
  }
  if (isJouwTafel && memberDecision.kind === "past_due") {
    return NextResponse.json(
      {
        code: "member_past_due",
        error:
          locale === "en"
            ? "Your last membership payment did not go through. Update your payment details in your settings first."
            : "Je laatste betaling voor je lidmaatschap is niet gelukt. Werk eerst je betaalgegevens bij in je instellingen.",
      },
      { status: 409 },
    );
  }
  if (isJouwTafel && !earlyAccessAllows(memberDecision, event.membersOnlyUntil)) {
    return NextResponse.json(
      {
        code: "members_only",
        until: event.membersOnlyUntil?.toISOString() ?? null,
        error:
          locale === "en"
            ? `Members are booking now, you can from ${openFromLabel(event.membersOnlyUntil!, locale)}.`
            : `Leden boeken nu, jij vanaf ${openFromLabel(event.membersOnlyUntil!, locale)}.`,
      },
      { status: 409 },
    );
  }

  if (isJouwTafel && memberDecision.kind === "included" && runningMembership && signedInUser?.email) {
    const memberSeats = resolveSundayTableSeats(Math.max(1, Number(body.seats) || 1), event.capacity - event.spotsSold);
    if (memberSeats === null) {
      return NextResponse.json(
        { error: locale === "en" ? "Not enough seats left." : "Niet genoeg plekken over." },
        { status: 409 },
      );
    }
    try {
      const result = await bookAsMember({
        event,
        membership: runningMembership,
        email: signedInUser.email.trim().toLowerCase(),
        name: customerName,
        seats: memberSeats === 2 ? 2 : 1,
        locale,
        dietaryNotes: body.dietaryNotes?.trim() || null,
        tableLanguagePreference,
      });
      if (result.kind === "booked") {
        return NextResponse.json({ booked: true, bookingId: result.bookingId, code: result.code });
      }
      if (result.kind === "checkout") {
        return NextResponse.json({ url: result.url, bookingId: result.bookingId });
      }
      const messages = {
        already_booked: locale === "en" ? "You already have a seat at this table." : "Je hebt al een plek aan deze tafel.",
        full: locale === "en" ? "Not enough seats left." : "Niet genoeg plekken over.",
        checkout_failed: locale === "en" ? "Checkout failed." : "Checkout mislukt.",
      };
      return NextResponse.json({ code: result.code, error: messages[result.code] }, { status: result.status });
    } catch (error) {
      console.error("[checkout] member booking failed", error);
      captureCriticalError(error, {
        flow: "payment",
        step: "member_booking",
        tags: { event_id: event.id, membership_id: runningMembership.id },
      });
      return NextResponse.json({ error: "Checkout mislukt." }, { status: 500 });
    }
  }

  const requestedTier = isBookingTier(body.pricingTier)
    ? body.pricingTier
    : tierForSeats(Math.max(1, Number(body.seats) || 1));
  const seatingPreference = isSundayTable
    ? "join_others"
    : seatingForTier(requestedTier);

  const spotsLeft = event.capacity - event.spotsSold;

  let seats: number | null;
  let perSeatCents: number;
  let amountCents: number;

  if (isSundayTable) {
    const requestedSeats = Math.max(1, Number(body.seats) || 1);
    seats = resolveSundayTableSeats(requestedSeats, spotsLeft);
    perSeatCents = resolveSeatPriceCents({
      eventPriceCents: event.priceCents,
      isJouwTafel,
    });
    amountCents = seats !== null ? perSeatCents * seats : 0;
  } else {
    const requestedSeats = Math.max(
      MIN_BOOKING_SEATS,
      Number(body.seats) || MIN_BOOKING_SEATS,
    );
    seats = resolveSeatsForTier(requestedTier, requestedSeats, spotsLeft);
    const tierPrice =
      seats !== null
        ? computeTierPrice(requestedTier, seats, {
            perPersonCents: event.priceCents,
          })
        : null;
    perSeatCents = tierPrice?.perPersonCents ?? event.priceCents;
    amountCents = tierPrice?.totalCents ?? 0;
  }

  if (seats === null) {
    return NextResponse.json(
      {
        error: isSundayTable
          ? locale === "en"
            ? "Invalid number of seats (1 or 2)."
            : "Ongeldig aantal plekken (1 of 2)."
          : locale === "en"
            ? `Invalid number of seats (minimum ${MIN_BOOKING_SEATS}).`
            : `Ongeldig aantal plekken (minimaal ${MIN_BOOKING_SEATS}).`,
      },
      { status: 400 },
    );
  }

  if (spotsLeft < seats) {
    return NextResponse.json({ error: "Niet genoeg plekken over." }, { status: 409 });
  }
  const [booking] = await db
    .insert(bookings)
    .values({
      eventId: event.id,
      email,
      customerName,
      seats,
      amountCents,
      locale,
      dietaryNotes: body.dietaryNotes?.trim() || null,
      seatingPreference,
      tableLanguagePreference,
      paymentStatus: "pending",
      affiliateCode: body.affiliateCode?.trim().toUpperCase() || null,
      referralCode: body.referralCode?.trim().toUpperCase() || null,
      fromSundayTable: body.fromSundayTable === true,
    })
    .returning();

  await onBookingCreated({ booking, event });

  await db.insert(bookingEvents).values({
    bookingId: booking.id,
    type: MEDIA_MARKETING_CONSENT_EVENT,
    payload: {
      version: MEDIA_MARKETING_CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      locale,
    },
  });

  if (isJouwTafel) {
    await db.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "checkout_source",
      payload: { source: JOUW_TAFEL_CHECKOUT_SOURCE, perSeatCents },
    });
  }

  if (typeof body.joinPriorityList === "boolean") {
    await db.insert(bookingEvents).values({
      bookingId: booking.id,
      type: PRIORITY_LIST_OPT_IN_EVENT,
      payload: { optIn: body.joinPriorityList },
    });
  }

  // Enroll immediately (no need to wait for payment).
  // Never block checkout on priority-list issues (schema mismatch, DB hiccups, etc.).
  if (body.joinPriorityList === true) {
    void ensurePriorityListSignup({
      email: booking.email,
      city: event.city,
      locale: booking.locale,
      name: booking.customerName ?? undefined,
      signedUpAt: booking.createdAt,
    }).catch((err) => {
      console.error("[priority-list] enroll at checkout failed", err);
    });
  }

  const utm = cleanAttribution(body.utm);
  const metaContext = parseMetaTrackingContext(body.meta);
  if (Object.keys(utm).length > 0) {
    await db.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "checkout_utm",
      payload: utm,
    });
  }

  const checkoutMeta = withRequestClientHints(metaContext, request);
  if (
    checkoutMeta.fbp ||
    checkoutMeta.fbc ||
    checkoutMeta.eventSourceUrl ||
    checkoutMeta.clientIpAddress ||
    checkoutMeta.clientUserAgent
  ) {
    await db.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "checkout_meta_context",
      payload: checkoutMeta,
    });
  }

  const nameParts = splitPersonName(booking.customerName);
  void sendMetaCapiInitiateCheckout({
    booking,
    event,
    userData: metaUserDataFromRequest(
      request,
      checkoutMeta,
      booking.email,
      nameParts.firstName,
      {
        lastName: nameParts.lastName,
        city: event.city,
        country: "nl",
      },
    ),
  });

  const stripe = getStripe();
  const siteUrl = getSiteUrl();
  const productName =
    locale === "nl" ? event.nameNl : event.nameEn;

  try {
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
            unit_amount: perSeatCents,
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
        pricing_tier: requestedTier,
        affiliate_code: booking.affiliateCode ?? "",
        from_sunday_table: booking.fromSundayTable ? "1" : "0",
        source: isJouwTafel ? JOUW_TAFEL_CHECKOUT_SOURCE : "site",
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
      price_per_seat: perSeatCents / 100,
      pricing_tier: requestedTier,
      stripe_session_id: session.id,
      language: locale,
    });

    if (!session.url) {
      captureCriticalError(new Error("Stripe checkout session missing url"), {
        flow: "payment",
        step: "agenda_checkout",
        tags: { event_id: event.id, booking_id: booking.id },
      });
      return NextResponse.json({ error: "Checkout mislukt." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, bookingId: booking.id });
  } catch (error) {
    console.error("[checkout] stripe session create failed", error);
    captureCriticalError(error, {
      flow: "payment",
      step: "agenda_checkout",
      tags: { event_id: event.id, booking_id: booking.id },
    });
    return NextResponse.json({ error: "Checkout mislukt." }, { status: 500 });
  }
}
