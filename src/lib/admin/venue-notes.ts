import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { events, venueNotes, venues } from "@/db/schema";

export type VenueNote = {
  id: string;
  body: string;
  createdAt: string;
  venueName: string | null;
  /** The Sunday it is about, if any. */
  event: { id: string; city: string; startsAt: string } | null;
};

function select() {
  return getDb()
    .select({ note: venueNotes, venueName: venues.name, eventCity: events.city, eventStartsAt: events.startsAt })
    .from(venueNotes)
    .leftJoin(venues, eq(venues.id, venueNotes.venueId))
    .leftJoin(events, eq(events.id, venueNotes.eventId));
}

type Row = Awaited<ReturnType<ReturnType<typeof select>["where"]>>[number];

function toNote(r: Row): VenueNote {
  return {
    id: r.note.id,
    body: r.note.body,
    createdAt: r.note.createdAt.toISOString(),
    venueName: r.venueName,
    event:
      r.note.eventId && r.eventCity && r.eventStartsAt
        ? { id: r.note.eventId, city: r.eventCity, startsAt: r.eventStartsAt.toISOString() }
        : null,
  };
}

export async function notesForEvent(eventId: string): Promise<VenueNote[]> {
  return (await select().where(eq(venueNotes.eventId, eventId)).orderBy(desc(venueNotes.createdAt))).map(toNote);
}

export async function notesForVenue(venueId: string): Promise<VenueNote[]> {
  return (await select().where(eq(venueNotes.venueId, venueId)).orderBy(desc(venueNotes.createdAt))).map(toNote);
}
