import { and, count, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events, memberships, type Event, type Membership } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { reservationCode } from "@/lib/booking-display";
import { onBookingCreated } from "@/lib/customers/hooks";
import { getSiteUrl } from "@/lib/env";
import { confirmMemberBooking } from "@/lib/membership/bookings";
import { freeGuestAvailable, memberBookingAmountCents } from "@/lib/membership/logic";
import { MEMBER_MAX_UPCOMING_BOOKINGS, guestSeatCents, isMembershipPlanId } from "@/lib/membership/plans";
import { getCheckoutPaymentMethodTypes, getStripe } from "@/lib/stripe";
import { jouwTafelSettingsPath, jouwTafelKiesPath } from "@/i18n/config";

/** booking_events type: this booking's guest came along for free. */
export const FREE_GUEST_EVENT = "member_free_guest";

export type MemberBookingResult =
  /** Own seat only: booked straight away, no payment. */
  | { kind: "booked"; bookingId: string; code: string }
  /** With a guest: a one-time Checkout for the guest seat. */
  | { kind: "checkout"; url: string; bookingId: string }
  | { kind: "error"; status: number; code: "already_booked" | "full" | "checkout_failed" | "max_upcoming" };

/** True when this membership already has an active seat at this table. */
async function alreadyBooked(membershipId: string, eventId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.membershipId, membershipId),
        eq(bookings.eventId, eventId),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** How many Sundays still to come this membership has a seat at. */
async function upcomingBookings(membershipId: string, now = new Date()): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(
      and(
        eq(bookings.membershipId, membershipId),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        gt(events.startsAt, now),
      ),
    );
  return Number(row?.n ?? 0);
}

/**
 * A member books a Sunday Social: their own seat is included (amount 0); a
 * second seat for a guest is free once every 3 months, and otherwise costs
 * the member price, paid in a one-time Checkout. Capacity is checked when
 * the seats are taken.
 */
export async function bookAsMember(input: {
  event: Event;
  membership: Membership;
  email: string;
  name: string;
  seats: 1 | 2;
  locale: Locale;
  dietaryNotes: string | null;
  tableLanguagePreference: string;
  birthDate?: string | null;
  agePreference?: string | null;
}): Promise<MemberBookingResult> {
  const { event, membership } = input;
  if (!isMembershipPlanId(membership.plan)) return { kind: "error", status: 500, code: "checkout_failed" };
  if (await alreadyBooked(membership.id, event.id)) return { kind: "error", status: 409, code: "already_booked" };
  // At most 2 Sundays to come at a time: a free seat is not held for months.
  if ((await upcomingBookings(membership.id)) >= MEMBER_MAX_UPCOMING_BOOKINGS) {
    return { kind: "error", status: 409, code: "max_upcoming" };
  }
  if (event.capacity - event.spotsSold < input.seats) return { kind: "error", status: 409, code: "full" };

  const guestCents = guestSeatCents(membership.plan);
  const db = getDb();
  // The free guest: taken here, in one statement, so two bookings at once
  // cannot both get it. Given back below when the booking does not go through.
  const previousFreeGuest = membership.freeGuestUsedFor;
  let freeGuest = false;
  if (input.seats === 2 && freeGuestAvailable(previousFreeGuest)) {
    const [taken] = await db
      .update(memberships)
      .set({ freeGuestUsedFor: event.startsAt, updatedAt: new Date() })
      .where(
        and(
          eq(memberships.id, membership.id),
          previousFreeGuest
            ? or(isNull(memberships.freeGuestUsedFor), lte(memberships.freeGuestUsedFor, previousFreeGuest))
            : isNull(memberships.freeGuestUsedFor),
        ),
      )
      .returning({ id: memberships.id });
    freeGuest = Boolean(taken);
  }
  const giveFreeGuestBack = async () => {
    if (!freeGuest) return;
    await db
      .update(memberships)
      .set({ freeGuestUsedFor: previousFreeGuest ?? null })
      .where(and(eq(memberships.id, membership.id), eq(memberships.freeGuestUsedFor, event.startsAt)));
  };
  const amountCents = memberBookingAmountCents(input.seats, guestCents, freeGuest);
  const [booking] = await db
    .insert(bookings)
    .values({
      eventId: event.id,
      email: input.email,
      customerName: input.name || null,
      seats: input.seats,
      amountCents,
      locale: input.locale,
      dietaryNotes: input.dietaryNotes,
      seatingPreference: "join_others",
      tableLanguagePreference: input.tableLanguagePreference,
      birthDate: input.birthDate || null,
      agePreference: input.agePreference || null,
      paymentStatus: "pending",
      membershipId: membership.id,
    })
    .returning();
  if (!booking) {
    await giveFreeGuestBack();
    return { kind: "error", status: 500, code: "checkout_failed" };
  }
  await onBookingCreated({ booking, event }).catch(() => undefined);
  if (freeGuest) {
    await db.insert(bookingEvents).values({ bookingId: booking.id, type: FREE_GUEST_EVENT, payload: { plan: membership.plan } });
  }

  if (amountCents === 0) {
    const confirmed = await confirmMemberBooking({ bookingId: booking.id, membershipId: membership.id, context: "member_free_seat" });
    if (!confirmed.ok) {
      await db.update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, booking.id));
      await giveFreeGuestBack();
      return { kind: "error", status: 409, code: "full" };
    }
    return { kind: "booked", bookingId: booking.id, code: reservationCode(booking.id) };
  }

  await db.insert(bookingEvents).values({
    bookingId: booking.id,
    type: "member_guest_checkout_started",
    payload: { guestCents, plan: membership.plan },
  });
  const site = getSiteUrl().replace(/\/$/, "");
  const en = input.locale === "en";
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: input.email,
      locale: en ? "en" : "nl",
      payment_method_types: getCheckoutPaymentMethodTypes("EUR"),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: guestCents,
            product_data: {
              name: en ? "Guest at your Sunday Social (member price)" : "Gast aan je Sunday Social (ledenprijs)",
              description: `${event.city} · MyTable`,
            },
          },
        },
      ],
      metadata: {
        booking_id: booking.id,
        event_id: event.id,
        membership_id: membership.id,
        from_sunday_table: "0",
      },
      success_url: `${site}${jouwTafelSettingsPath(input.locale)}?geboekt=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}${jouwTafelKiesPath(input.locale)}`,
    });
    await db.update(bookings).set({ stripeCheckoutSessionId: session.id }).where(eq(bookings.id, booking.id));
    if (!session.url) return { kind: "error", status: 500, code: "checkout_failed" };
    return { kind: "checkout", url: session.url, bookingId: booking.id };
  } catch (error) {
    await db.update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, booking.id));
    throw error;
  }
}
