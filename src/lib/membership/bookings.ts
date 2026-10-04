import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events, type Booking, type Event } from "@/db/schema";
import { onBookingCancelled, onPaymentCompleted } from "@/lib/customers/hooks";
import { deliverBookingConfirmationEmail } from "@/lib/email/deliver-booking-confirmation";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { canMemberCancelSeat } from "@/lib/membership/logic";

// Member bookings: the member's own seat is included (amount 0), a guest
// seat costs the member price. They are ordinary `bookings` rows with
// membership_id set, so the guest list, capacity (spots_sold) and revenue
// (amount_cents) all keep working.

export type ConfirmResult =
  | { ok: true; booking: Booking; event: Event; alreadyConfirmed: boolean }
  | { ok: false; error: "not_found" | "capacity" | "not_pending" };

/**
 * Turns a pending member booking into a paid one: takes the seats
 * (capacity checked) and links the membership. Idempotent: a booking that
 * is already paid returns alreadyConfirmed.
 */
export async function confirmMemberBooking(input: {
  bookingId: string;
  membershipId: string;
  amountCents?: number;
  context: string;
}): Promise<ConfirmResult> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
    if (!booking) return { ok: false as const, error: "not_found" as const };
    const [current] = await tx.select().from(events).where(eq(events.id, booking.eventId)).limit(1);
    if (!current) return { ok: false as const, error: "not_found" as const };
    if (booking.paymentStatus === "paid") {
      return { ok: true as const, booking, event: current, alreadyConfirmed: true };
    }
    if (booking.paymentStatus !== "pending") return { ok: false as const, error: "not_pending" as const };

    const [ev] = await tx
      .update(events)
      .set({ spotsSold: sql`${events.spotsSold} + ${booking.seats}`, updatedAt: new Date() })
      .where(sql`${events.id} = ${booking.eventId} AND ${events.spotsSold} + ${booking.seats} <= ${events.capacity}`)
      .returning();
    if (!ev) return { ok: false as const, error: "capacity" as const };

    const [paid] = await tx
      .update(bookings)
      .set({
        paymentStatus: "paid",
        membershipId: input.membershipId,
        ...(input.amountCents !== undefined ? { amountCents: input.amountCents } : {}),
      })
      .where(and(eq(bookings.id, booking.id), eq(bookings.paymentStatus, "pending")))
      .returning();
    if (!paid) throw new Error("Member booking changed while confirming");

    await tx.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "member_booking_confirmed",
      payload: { context: input.context, membershipId: input.membershipId, amountCents: paid.amountCents },
    });
    return { ok: true as const, booking: paid, event: ev, alreadyConfirmed: false };
  });

  if (result.ok && !result.alreadyConfirmed) {
    revalidateEventPaths(result.event);
    await deliverBookingConfirmationEmail(result.booking, result.event, "member");
    try {
      await onPaymentCompleted({ booking: result.booking, event: result.event });
    } catch (error) {
      console.error("[membership] CRM hook failed", error);
    }
  }
  return result;
}

export type CancelSeatResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "not_member_seat" | "too_late" | "already_cancelled" };

/**
 * A member cancels their own booking (until MEMBER_SEAT_CANCEL_HOURS before
 * the start). A plain cancellation: the seats are freed, nothing is
 * refunded, also not a guest seat paid at the member price (founder's
 * decision). The booking stays "paid" (the money was kept) and is marked
 * removed.
 */
export async function cancelMemberSeat(input: {
  bookingId: string;
  email: string;
  now?: number;
}): Promise<CancelSeatResult> {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!row || row.booking.email.trim().toLowerCase() !== input.email.trim().toLowerCase()) {
    return { ok: false, error: "not_found" };
  }
  const { booking, event } = row;
  if (!booking.membershipId) return { ok: false, error: "not_member_seat" };
  if (booking.lifecycleStatus !== "active" || booking.paymentStatus !== "paid") {
    return { ok: false, error: "already_cancelled" };
  }
  if (!canMemberCancelSeat(event.startsAt, input.now ?? Date.now())) return { ok: false, error: "too_late" };

  const updated = await db.transaction(async (tx) => {
    const [changed] = await tx
      .update(bookings)
      .set({ lifecycleStatus: "removed" })
      .where(and(eq(bookings.id, booking.id), eq(bookings.lifecycleStatus, "active"), eq(bookings.paymentStatus, "paid")))
      .returning();
    if (!changed) return null;
    await tx
      .update(events)
      .set({ spotsSold: sql`GREATEST(${events.spotsSold} - ${booking.seats}, 0)`, updatedAt: new Date() })
      .where(eq(events.id, event.id));
    await tx.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "cancelled_by_member",
      payload: { seats: booking.seats, amountCents: booking.amountCents },
    });
    return changed;
  });
  if (!updated) return { ok: false, error: "already_cancelled" };

  revalidateEventPaths(event);
  if (booking.customerId) {
    await onBookingCancelled({ customerId: booking.customerId, booking: updated, event }).catch(() => undefined);
  }
  return { ok: true };
}
