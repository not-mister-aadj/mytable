import { and, eq, inArray, sql } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";

const activeAttendanceWhere = and(
  eq(bookings.paymentStatus, "paid"),
  eq(bookings.lifecycleStatus, "active"),
);

/** Zet spotsSold gelijk aan som van actieve betaalde boekingen (bron van waarheid). */
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
        .where(and(eq(bookings.eventId, eventId), activeAttendanceWhere));

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

  await db.execute(sql`
    UPDATE events AS e
    SET
      spots_sold = COALESCE(b.total, 0),
      updated_at = NOW()
    FROM (
      SELECT
        event_id,
        COALESCE(SUM(seats), 0)::int AS total
      FROM bookings
      WHERE payment_status = 'paid'
        AND lifecycle_status = 'active'
      GROUP BY event_id
    ) AS b
    WHERE e.id = b.event_id
  `);

  await db.execute(sql`
    UPDATE events
    SET spots_sold = 0, updated_at = NOW()
    WHERE id NOT IN (
      SELECT DISTINCT event_id
      FROM bookings
      WHERE payment_status = 'paid'
        AND lifecycle_status = 'active'
    )
  `);
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
    .where(and(eq(bookings.eventId, eventId), activeAttendanceWhere));
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
      and(inArray(bookings.eventId, eventIds), activeAttendanceWhere),
    )
    .groupBy(bookings.eventId);

  return new Map(rows.map((r) => [r.eventId, r.total]));
}
