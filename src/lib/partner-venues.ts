import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { venues } from "@/db/schema";

/** A bar in a city's partner selection, as the Sunday Social page shows it. */
export type PartnerVenue = {
  id: string;
  name: string;
  area: string | null;
  atmosphere: string | null;
  imageUrl: string | null;
};

/** A bar we reserved at on one Sunday, as a member sees it. */
export type ReservedVenue = {
  id: string;
  name: string;
  area: string | null;
  /** Seats still free; null when we set no number. */
  seatsLeft: number | null;
};

/** Every partner bar of a city, by name. */
export async function getCityPartners(city: string): Promise<PartnerVenue[]> {
  if (!isDbConfigured()) return [];
  return getDb()
    .select({
      id: venues.id,
      name: venues.name,
      area: venues.area,
      atmosphere: venues.atmosphere,
      imageUrl: venues.imageUrl,
    })
    .from(venues)
    .where(and(eq(venues.partner, true), sql`lower(${venues.city}) = lower(${city})`))
    .orderBy(asc(venues.name));
}

/** The bars reserved for one Sunday, with the seats members have not picked yet. */
export async function getReservedVenues(eventId: string): Promise<ReservedVenue[]> {
  if (!isDbConfigured()) return [];
  const rows = (await getDb().execute(sql`
    select v.id, v.name, v.area, ev.seats,
           coalesce((select sum(b.seats) from bookings b
                     where b.event_id = ev.event_id and b.preferred_venue_id = v.id
                       and b.payment_status = 'paid' and b.lifecycle_status = 'active'
                       and b.cancelled_late_at is null), 0)::int as taken
    from event_venues ev
    join venues v on v.id = ev.venue_id
    where ev.event_id = ${eventId}
    order by ev.position
  `)) as unknown as { id: string; name: string; area: string | null; seats: number | null; taken: number }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area,
    seatsLeft: r.seats === null ? null : Math.max(0, r.seats - r.taken),
  }));
}

/** True when `venueId` is reserved for this Sunday and has room for `seats`. */
export async function canPickVenue(eventId: string, venueId: string, seats: number): Promise<boolean> {
  const reserved = await getReservedVenues(eventId);
  const venue = reserved.find((v) => v.id === venueId);
  return Boolean(venue && (venue.seatsLeft === null || venue.seatsLeft >= seats));
}
