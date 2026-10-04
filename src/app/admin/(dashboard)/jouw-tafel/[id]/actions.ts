"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { bookings, eventGroups, eventVenues, events, venues } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { nextGroupNumber } from "@/lib/jouw-tafel/groups-logic";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";

function refresh(eventId: string) {
  revalidatePath(`/admin/jouw-tafel/${eventId}`);
  revalidatePath("/admin/jouw-tafel/kalender");
  revalidatePath("/admin/jouw-tafel");
}

async function requireTable(eventId: string) {
  const [event] = await getDb()
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.experienceType, JOUW_TAFEL_TYPE)))
    .limit(1);
  if (!event) throw new Error("Tafel niet gevonden.");
}

async function addGroup(eventId: string, venueId: string) {
  const db = getDb();
  const rows = await db
    .select({ number: eventGroups.number })
    .from(eventGroups)
    .where(and(eq(eventGroups.eventId, eventId), eq(eventGroups.venueId, venueId)));
  await db
    .insert(eventGroups)
    .values({ eventId, venueId, number: nextGroupNumber(rows.map((r) => r.number)) })
    .onConflictDoNothing();
}

/** Adds a venue to the table, with its first group. */
export async function addEventVenueAction(eventId: string, venueId: string) {
  await requireAdmin();
  await requireTable(eventId);
  const db = getDb();
  const [venue] = await db.select({ id: venues.id }).from(venues).where(eq(venues.id, venueId)).limit(1);
  if (!venue) throw new Error("Zaak niet gevonden.");
  const [{ next }] = (await db.execute(
    sql`select coalesce(max(position), -1) + 1 as next from event_venues where event_id = ${eventId}`,
  )) as unknown as [{ next: number }];
  const inserted = await db
    .insert(eventVenues)
    .values({ eventId, venueId, position: Number(next) })
    .onConflictDoNothing()
    .returning({ venueId: eventVenues.venueId });
  if (inserted.length > 0) await addGroup(eventId, venueId);
  refresh(eventId);
}

/** Removes a venue: its groups go, their guests back to "nog niet ingedeeld". */
export async function removeEventVenueAction(eventId: string, venueId: string) {
  await requireAdmin();
  await requireTable(eventId);
  const db = getDb();
  await db.transaction(async (tx) => {
    const groups = await tx
      .select({ id: eventGroups.id })
      .from(eventGroups)
      .where(and(eq(eventGroups.eventId, eventId), eq(eventGroups.venueId, venueId)));
    const ids = groups.map((g) => g.id);
    if (ids.length > 0) {
      await tx.update(bookings).set({ groupId: null }).where(inArray(bookings.groupId, ids));
      await tx.delete(eventGroups).where(inArray(eventGroups.id, ids));
    }
    await tx.delete(eventVenues).where(and(eq(eventVenues.eventId, eventId), eq(eventVenues.venueId, venueId)));
  });
  refresh(eventId);
}

/** One more group at a venue of this table. */
export async function addGroupAction(eventId: string, venueId: string) {
  await requireAdmin();
  await requireTable(eventId);
  const [linked] = await getDb()
    .select({ venueId: eventVenues.venueId })
    .from(eventVenues)
    .where(and(eq(eventVenues.eventId, eventId), eq(eventVenues.venueId, venueId)))
    .limit(1);
  if (!linked) throw new Error("Voeg eerst de zaak toe.");
  await addGroup(eventId, venueId);
  refresh(eventId);
}

/** Removes a group; its guests go back to "nog niet ingedeeld". */
export async function removeGroupAction(eventId: string, groupId: string) {
  await requireAdmin();
  const db = getDb();
  await db.update(bookings).set({ groupId: null }).where(eq(bookings.groupId, groupId));
  await db.delete(eventGroups).where(and(eq(eventGroups.id, groupId), eq(eventGroups.eventId, eventId)));
  refresh(eventId);
}

/** Puts a booking (all its seats) in a group, or back to unassigned (null). */
export async function assignBookingAction(eventId: string, bookingId: string, groupId: string | null) {
  await requireAdmin();
  const db = getDb();
  if (groupId) {
    const [group] = await db
      .select({ id: eventGroups.id })
      .from(eventGroups)
      .where(and(eq(eventGroups.id, groupId), eq(eventGroups.eventId, eventId)))
      .limit(1);
    if (!group) throw new Error("Groep niet gevonden.");
  }
  await db
    .update(bookings)
    .set({ groupId })
    .where(and(eq(bookings.id, bookingId), eq(bookings.eventId, eventId)));
  refresh(eventId);
}

/** Marks the groups final (or back to draft). */
export async function setGroupsFinalAction(eventId: string, final: boolean) {
  await requireAdmin();
  await requireTable(eventId);
  await getDb()
    .update(events)
    .set({ groupsFinalAt: final ? new Date() : null, updatedAt: new Date() })
    .where(eq(events.id, eventId));
  refresh(eventId);
}

/** The exception to the booking window: this table is bookable for
 * everyone from now on, without the members' head start. */
export async function openForEveryoneNowAction(eventId: string) {
  await requireAdmin();
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.experienceType, JOUW_TAFEL_TYPE)))
    .limit(1);
  if (!event) throw new Error("Tafel niet gevonden.");
  const [row] = await db
    .update(events)
    .set({
      extras: { ...(event.extras ?? {}), comingSoon: false, bookingOpensAt: new Date().toISOString() },
      membersOnlyUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();
  revalidateEventPaths(row);
  refresh(eventId);
}
