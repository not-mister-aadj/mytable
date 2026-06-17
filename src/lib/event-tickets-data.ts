import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";
import { reservationCode } from "@/lib/booking-display";
import { reconcileEventSpotsSold } from "@/lib/reconcile-spots-sold";
import type { EventTicketsData } from "@/lib/event-tickets-types";

export async function getEventTicketsData(
  eventId: string,
): Promise<EventTicketsData> {
  const db = getDb();

  await reconcileEventSpotsSold([eventId]);

  const ticketRows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.eventId, eventId),
        eq(bookings.paymentStatus, "paid"),
        inArray(bookings.lifecycleStatus, ["active", "transferred"]),
      ),
    )
    .orderBy(desc(bookings.createdAt));

  const transferredToIds = [
    ...new Set(
      ticketRows
        .map((b) => b.transferredToEventId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const destinationEvents =
    transferredToIds.length > 0
      ? await db
          .select()
          .from(events)
          .where(inArray(events.id, transferredToIds))
      : [];

  const destinationById = new Map(
    destinationEvents.map((event) => [event.id, event]),
  );

  const targetRows = await db
    .select()
    .from(events)
    .where(
      and(ne(events.id, eventId), ne(events.workflowStatus, "cancelled")),
    )
    .orderBy(events.startsAt);

  return {
    tickets: ticketRows.map((b) => {
      const destination = b.transferredToEventId
        ? destinationById.get(b.transferredToEventId)
        : undefined;

      return {
        id: b.id,
        reservationCode: reservationCode(b.id),
        customerName: b.customerName,
        email: b.email,
        seats: b.seats,
        dietaryNotes: b.dietaryNotes,
        seatingPreference: b.seatingPreference,
        createdAt: b.createdAt.toISOString(),
        lifecycleStatus: b.lifecycleStatus,
        transferredAt: b.transferredAt?.toISOString() ?? null,
        transferredBy: b.transferredBy,
        transferDestination: destination
          ? {
              eventId: destination.id,
              nameNl: destination.nameNl,
              city: destination.city,
              startsAt: destination.startsAt.toISOString(),
              slug: destination.slug,
            }
          : null,
      };
    }),
    transferTargets: targetRows.map((e) => ({
      id: e.id,
      nameNl: e.nameNl,
      city: e.city,
      startsAt: e.startsAt.toISOString(),
      capacity: e.capacity,
      spotsSold: e.spotsSold,
      spotsAvailable: Math.max(0, e.capacity - e.spotsSold),
      workflowStatus: e.workflowStatus,
    })),
  };
}
