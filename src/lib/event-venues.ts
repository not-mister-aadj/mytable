import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { eventVenues, venues } from "@/db/schema";
import { parseEventExtras } from "@/lib/event-extras";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Real venue ids for an event, in order: the legacy venue_id first, then the
 * extras.venueIds stops. Placeholders ("mytable:location-tbd") and other
 * non-uuids are dropped, duplicates keep their first position. */
export function eventVenueIdsFromEvent(event: {
  venueId: string | null;
  extras: unknown;
}): string[] {
  const extras = parseEventExtras(event.extras);
  const candidates = [event.venueId, ...(extras.venueIds ?? [])];
  const ids: string[] = [];
  for (const raw of candidates) {
    const id = raw?.trim().toLowerCase();
    if (!id || !UUID_RE.test(id) || ids.includes(id)) continue;
    ids.push(id);
  }
  return ids;
}

/** The venues linked to one event, in position order. */
export async function getEventVenueIds(eventId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ venueId: eventVenues.venueId })
    .from(eventVenues)
    .where(eq(eventVenues.eventId, eventId))
    .orderBy(asc(eventVenues.position));
  return rows.map((r) => r.venueId);
}

/**
 * Replaces the event's event_venues rows with `venueIds` (position = index).
 * Ids that are not (or no longer) a venue row are skipped so a stale id in
 * extras never breaks a save.
 */
export async function replaceEventVenues(
  eventId: string,
  venueIds: string[],
): Promise<void> {
  const db = getDb();
  const existing =
    venueIds.length > 0
      ? await db
          .select({ id: venues.id })
          .from(venues)
          .where(inArray(venues.id, venueIds))
      : [];
  const known = new Set(existing.map((v) => v.id));
  const rows = venueIds
    .filter((id) => known.has(id))
    .map((venueId, position) => ({ eventId, venueId, position }));

  await db.transaction(async (tx) => {
    await tx.delete(eventVenues).where(eq(eventVenues.eventId, eventId));
    if (rows.length > 0) {
      await tx.insert(eventVenues).values(rows);
    }
  });
}

/**
 * Sync after an admin event editor save. An event without any real venue in
 * the editor (Sunday Table ticket events, tastings that lean on the
 * experience type's default venues) keeps the links it already has, since
 * those were set on the Sunday Table page or confirmed by hand.
 */
export async function syncEventVenuesFromEvent(event: {
  id: string;
  venueId: string | null;
  extras: unknown;
}): Promise<void> {
  const ids = eventVenueIdsFromEvent(event);
  if (ids.length === 0) return;
  await replaceEventVenues(event.id, ids);
}
