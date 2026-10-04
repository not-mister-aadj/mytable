import { eq } from "drizzle-orm";
import { bookingEvents, bookings, events, type Booking, type Event } from "@/db/schema";
import { getDb } from "@/db/index";
import { onBookingCreated, onBookingMoved } from "@/lib/customers/hooks";
import { buildBookingMovedEmailProps } from "@/lib/email/build-email-props";
import { sendBookingMovedEmail } from "@/lib/email/sendBookingMovedEmail";
import { reconcileEventSpotsSold } from "@/lib/reconcile-spots-sold";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";

export type TransferBookingOutcome = {
  newBooking: Booking;
  sourceEvent: Event;
  targetEvent: Event;
};

/**
 * Moves a paid, active booking to another table: the old row becomes
 * "transferred" (transferred_to_event_id / transferred_to_booking_id), a new
 * active row is made on the target (transferred_from_booking_id), spots_sold
 * is reconciled on both events, the CRM logs it and the "moved" mail goes
 * out. Used by the admin transfer and by the customer's own "verzetten".
 * The new booking can be moved again later (chaining).
 * Throws an Error with a Dutch message when it cannot be moved.
 */
export async function transferBooking(input: {
  bookingId: string;
  targetEventId: string;
  /** Who moved it (admin email, or "klant"). */
  by: string | null;
  /** The customer did it themselves (mail wording). */
  selfService?: boolean;
}): Promise<TransferBookingOutcome> {
  const { bookingId, targetEventId, by } = input;
  const db = getDb();
  const slugs = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .for("update")
      .limit(1);

    if (!booking) {
      throw new Error("Boeking niet gevonden");
    }
    if (booking.paymentStatus !== "paid") {
      throw new Error("Alleen bevestigde betalingen kunnen worden verplaatst");
    }
    if (booking.lifecycleStatus !== "active") {
      throw new Error("Deze boeking is niet meer actief op deze tafel");
    }
    if (booking.eventId === targetEventId) {
      throw new Error("Kies een andere tafel");
    }

    const [sourceEvent] = await tx
      .select()
      .from(events)
      .where(eq(events.id, booking.eventId))
      .limit(1);
    const [targetEvent] = await tx
      .select()
      .from(events)
      .where(eq(events.id, targetEventId))
      .for("update")
      .limit(1);

    if (!sourceEvent || !targetEvent) {
      throw new Error("Tafel niet gevonden");
    }
    if (targetEvent.workflowStatus === "cancelled") {
      throw new Error("Doeltafel is geannuleerd");
    }
    if (targetEvent.spotsSold + booking.seats > targetEvent.capacity) {
      throw new Error("Niet genoeg plekken op de doeltafel");
    }

    const transferredAt = new Date();

    const [newBooking] = await tx
      .insert(bookings)
      .values({
        eventId: targetEventId,
        customerId: booking.customerId,
        email: booking.email,
        customerName: booking.customerName,
        seats: booking.seats,
        amountCents: booking.amountCents,
        currency: booking.currency,
        stripePaymentIntentId: booking.stripePaymentIntentId,
        paymentStatus: "paid",
        locale: booking.locale,
        dietaryNotes: booking.dietaryNotes,
        seatingPreference: booking.seatingPreference,
        tableLanguagePreference: booking.tableLanguagePreference,
        adminNotes: booking.adminNotes,
        confirmationEmailSentAt: booking.confirmationEmailSentAt,
        lifecycleStatus: "active",
        transferredFromBookingId: booking.id,
        transferredAt,
        transferredBy: by ?? undefined,
      })
      .returning();

    if (!newBooking) {
      throw new Error("Kon nieuwe boeking niet aanmaken");
    }

    await tx
      .update(bookings)
      .set({
        lifecycleStatus: "transferred",
        transferredToEventId: targetEventId,
        transferredToBookingId: newBooking.id,
        transferredAt,
        transferredBy: by ?? undefined,
      })
      .where(eq(bookings.id, bookingId));

    await tx.insert(bookingEvents).values([
      {
        bookingId,
        type: "transferred",
        payload: {
          fromEventId: sourceEvent.id,
          toEventId: targetEventId,
          toBookingId: newBooking.id,
          by,
        },
      },
      {
        bookingId: newBooking.id,
        type: "transferred_in",
        payload: {
          fromEventId: sourceEvent.id,
          fromBookingId: bookingId,
          by,
        },
      },
    ]);

    return {
      sourceSlug: sourceEvent.slug,
      targetSlug: targetEvent.slug,
      eventIds: [sourceEvent.id, targetEventId] as const,
      newBooking,
      sourceEvent,
      targetEvent,
      customerId: booking.customerId,
      sourceBookingId: bookingId,
    };
  });

  if (slugs.customerId) {
    await onBookingMoved({
      customerId: slugs.customerId,
      fromEvent: slugs.sourceEvent,
      toEvent: slugs.targetEvent,
      fromBookingId: slugs.sourceBookingId,
      toBookingId: slugs.newBooking.id,
      by,
    });
  } else {
    const customerId = await onBookingCreated({
      booking: slugs.newBooking,
      event: slugs.targetEvent,
    });
    await onBookingMoved({
      customerId,
      fromEvent: slugs.sourceEvent,
      toEvent: slugs.targetEvent,
      fromBookingId: slugs.sourceBookingId,
      toBookingId: slugs.newBooking.id,
      by,
    });
  }

  await reconcileEventSpotsSold([...slugs.eventIds]);
  revalidateEventPaths(slugs.sourceEvent);
  revalidateEventPaths(slugs.targetEvent);

  try {
    const movedProps = await buildBookingMovedEmailProps(
      slugs.newBooking,
      slugs.sourceEvent,
      slugs.targetEvent,
    );
    await sendBookingMovedEmail({ ...movedProps, selfService: input.selfService });
  } catch (emailErr) {
    console.error("[transfer booking] moved email failed", emailErr);
  }

  return { newBooking: slugs.newBooking, sourceEvent: slugs.sourceEvent, targetEvent: slugs.targetEvent };
}
