import { and, desc, eq, ne } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";
import { reservationCode } from "@/lib/booking-display";
import type { EventTicketsData } from "@/lib/event-tickets-types";

export async function getEventTicketsData(
  eventId: string,
): Promise<EventTicketsData> {
  const db = getDb();

  const ticketRows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.eventId, eventId),
        eq(bookings.paymentStatus, "paid"),
      ),
    )
    .orderBy(desc(bookings.createdAt));

  const targetRows = await db
    .select()
    .from(events)
    .where(
      and(ne(events.id, eventId), ne(events.workflowStatus, "cancelled")),
    )
    .orderBy(events.startsAt);

  return {
    tickets: ticketRows.map((b) => ({
      id: b.id,
      reservationCode: reservationCode(b.id),
      customerName: b.customerName,
      email: b.email,
      seats: b.seats,
      dietaryNotes: b.dietaryNotes,
      createdAt: b.createdAt.toISOString(),
    })),
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
