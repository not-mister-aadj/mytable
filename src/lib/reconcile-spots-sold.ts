import { and, eq, inArray, sql } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";

/** Zet spotsSold gelijk aan som van betaalde boekingen (bron van waarheid). */
export async function reconcileEventSpotsSold(
  eventIds?: string[],
): Promise<void> {
  const db = getDb();

  if (eventIds?.length) {
    for (const eventId of eventIds) {
      const [row] = await db
        .select({
          total: sql<number>`coalesce(sum(${bookings.seats}), 0)::int`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.eventId, eventId),
            eq(bookings.paymentStatus, "paid"),
          ),
        );

      await db
        .update(events)
        .set({
          spotsSold: row?.total ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));
    }
    return;
  }

  const totals = await db
    .select({
      eventId: bookings.eventId,
      total: sql<number>`coalesce(sum(${bookings.seats}), 0)::int`,
    })
    .from(bookings)
    .where(eq(bookings.paymentStatus, "paid"))
    .groupBy(bookings.eventId);

  const paidByEvent = new Map(totals.map((r) => [r.eventId, r.total]));

  const allEvents = await db.select({ id: events.id }).from(events);
  for (const event of allEvents) {
    const sold = paidByEvent.get(event.id) ?? 0;
    await db
      .update(events)
      .set({ spotsSold: sold, updatedAt: new Date() })
      .where(eq(events.id, event.id));
  }
}

export async function reconcileAllEventSpotsSold(): Promise<void> {
  await reconcileEventSpotsSold();
}

export async function paidSeatsForEvent(eventId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.seats}), 0)::int`,
    })
    .from(bookings)
    .where(
      and(eq(bookings.eventId, eventId), eq(bookings.paymentStatus, "paid")),
    );
  return row?.total ?? 0;
}

export async function paidSeatsByEventIds(
  eventIds: string[],
): Promise<Map<string, number>> {
  if (eventIds.length === 0) return new Map();

  const db = getDb();
  const rows = await db
    .select({
      eventId: bookings.eventId,
      total: sql<number>`coalesce(sum(${bookings.seats}), 0)::int`,
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.eventId, eventIds),
        eq(bookings.paymentStatus, "paid"),
      ),
    )
    .groupBy(bookings.eventId);

  return new Map(rows.map((r) => [r.eventId, r.total]));
}
