import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, type Event, type Membership } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { reservationCode } from "@/lib/booking-display";
import { onBookingCreated } from "@/lib/customers/hooks";
import { getSiteUrl } from "@/lib/env";
import { confirmMemberBooking } from "@/lib/membership/bookings";
import { memberBookingAmountCents } from "@/lib/membership/logic";
import { guestSeatCents, isMembershipPlanId } from "@/lib/membership/plans";
import { getCheckoutPaymentMethodTypes, getStripe } from "@/lib/stripe";
import { jouwTafelSettingsPath, jouwTafelKiesPath } from "@/i18n/config";

export type MemberBookingResult =
  /** Own seat only: booked straight away, no payment. */
  | { kind: "booked"; bookingId: string; code: string }
  /** With a guest: a one-time Checkout for the guest seat. */
  | { kind: "checkout"; url: string; bookingId: string }
  | { kind: "error"; status: number; code: "already_booked" | "full" | "checkout_failed" };

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

/**
 * A member books a Sunday Table: their own seat is included (amount 0); a
 * second seat for a guest costs the plan's member price, paid in a one-time
 * Checkout. Capacity is checked when the seats are taken.
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
}): Promise<MemberBookingResult> {
  const { event, membership } = input;
  if (!isMembershipPlanId(membership.plan)) return { kind: "error", status: 500, code: "checkout_failed" };
  if (await alreadyBooked(membership.id, event.id)) return { kind: "error", status: 409, code: "already_booked" };
  if (event.capacity - event.spotsSold < input.seats) return { kind: "error", status: 409, code: "full" };

  const guestCents = guestSeatCents(membership.plan);
  const amountCents = memberBookingAmountCents(input.seats, guestCents);
  const db = getDb();
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
      paymentStatus: "pending",
      membershipId: membership.id,
    })
    .returning();
  if (!booking) return { kind: "error", status: 500, code: "checkout_failed" };
  await onBookingCreated({ booking, event }).catch(() => undefined);

  if (amountCents === 0) {
    const confirmed = await confirmMemberBooking({ bookingId: booking.id, membershipId: membership.id, context: "member_free_seat" });
    if (!confirmed.ok) {
      await db.update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, booking.id));
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
              name: en ? "Guest at your Sunday Table (member price)" : "Gast aan je Sunday Table (ledenprijs)",
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
