import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  bookings,
  customers,
  events,
  eventVenues,
  venues,
} from "@/db/schema";
import { customerDisplayName } from "@/lib/customers/normalize";

/**
 * Visit history for admin: who has been where. "Been there" is a paid,
 * active booking (no attendance tracking), so a moved booking only counts at
 * the event it was moved to. A +1 is a guest of the venue but not a person
 * of their own: it counts in seats and shows up on the buyer.
 *
 * Events that have not started yet are included but marked upcoming, so
 * admin can tell "geweest" from "gepland".
 */

const visitedBooking = and(
  eq(bookings.paymentStatus, "paid"),
  eq(bookings.lifecycleStatus, "active"),
);

type VisitRow = {
  bookingId: string;
  venueId: string;
  eventId: string;
  eventName: string;
  startsAt: Date;
  seats: number;
  plusOneName: string | null;
  customerId: string | null;
  bookingEmail: string;
  bookingName: string | null;
  firstName: string | null;
  lastName: string | null;
  customerEmail: string | null;
};

async function loadVenueVisitRows(where: SQL | undefined): Promise<VisitRow[]> {
  const db = getDb();
  return db
    .select({
      bookingId: bookings.id,
      venueId: eventVenues.venueId,
      eventId: events.id,
      eventName: events.nameNl,
      startsAt: events.startsAt,
      seats: bookings.seats,
      plusOneName: bookings.introPlusOneName,
      customerId: bookings.customerId,
      bookingEmail: bookings.email,
      bookingName: bookings.customerName,
      firstName: customers.firstName,
      lastName: customers.lastName,
      customerEmail: customers.email,
    })
    .from(eventVenues)
    .innerJoin(events, eq(events.id, eventVenues.eventId))
    .innerJoin(bookings, eq(bookings.eventId, events.id))
    .leftJoin(customers, eq(customers.id, bookings.customerId))
    .where(and(visitedBooking, where))
    .orderBy(asc(events.startsAt));
}

/** Customer id when we have one, else the booking email (older bookings). */
function buyerKey(row: VisitRow): string {
  return row.customerId ?? `email:${row.bookingEmail.trim().toLowerCase()}`;
}

function cleanName(name: string | null): string | null {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

export type VenueVisitTotals = {
  /** Events at this venue with at least one paid, active booking. */
  events: number;
  /** Seats, so +1s included. */
  guests: number;
  uniqueBuyers: number;
  /** Buyers with 2 or more different events at this venue. */
  returningBuyers: number;
  plusOnes: number;
  happened: { events: number; guests: number };
  upcoming: { events: number; guests: number };
};

export type VenueVisitBuyer = {
  customerId: string | null;
  name: string;
  email: string;
  events: number;
  seats: number;
  plusOnes: number;
  plusOneNames: string[];
  firstVisit: string;
  lastVisit: string;
  happenedEvents: number;
  upcomingEvents: number;
};

export type VenueVisitEvent = {
  eventId: string;
  eventName: string;
  startsAt: string;
  guests: number;
  buyers: number;
  happened: boolean;
};

export type VenueVisits = {
  totals: VenueVisitTotals;
  buyers: VenueVisitBuyer[];
  events: VenueVisitEvent[];
};

function summarize(rows: VisitRow[], now: Date): VenueVisits {
  const eventMap = new Map<string, VenueVisitEvent & { buyerKeys: Set<string> }>();
  const buyerMap = new Map<
    string,
    VenueVisitBuyer & { eventIds: Set<string>; happenedIds: Set<string> }
  >();
  let plusOnes = 0;

  for (const row of rows) {
    const happened = row.startsAt < now;
    const key = buyerKey(row);
    const extra = Math.max(row.seats - 1, 0);
    plusOnes += extra;

    let event = eventMap.get(row.eventId);
    if (!event) {
      event = {
        eventId: row.eventId,
        eventName: row.eventName,
        startsAt: row.startsAt.toISOString(),
        guests: 0,
        buyers: 0,
        happened,
        buyerKeys: new Set(),
      };
      eventMap.set(row.eventId, event);
    }
    event.guests += row.seats;
    event.buyerKeys.add(key);

    let buyer = buyerMap.get(key);
    if (!buyer) {
      const email = row.customerEmail ?? row.bookingEmail;
      buyer = {
        customerId: row.customerId,
        name:
          row.firstName || row.lastName
            ? customerDisplayName(row.firstName, row.lastName, email)
            : (cleanName(row.bookingName) ?? customerDisplayName(null, null, email)),
        email,
        events: 0,
        seats: 0,
        plusOnes: 0,
        plusOneNames: [],
        firstVisit: row.startsAt.toISOString(),
        lastVisit: row.startsAt.toISOString(),
        happenedEvents: 0,
        upcomingEvents: 0,
        eventIds: new Set(),
        happenedIds: new Set(),
      };
      buyerMap.set(key, buyer);
    }
    buyer.eventIds.add(row.eventId);
    if (happened) buyer.happenedIds.add(row.eventId);
    buyer.seats += row.seats;
    buyer.plusOnes += extra;
    const plusOneName = cleanName(row.plusOneName);
    if (plusOneName && !buyer.plusOneNames.includes(plusOneName)) {
      buyer.plusOneNames.push(plusOneName);
    }
    // Rows are ordered by start time, so the last one seen is the latest.
    buyer.lastVisit = row.startsAt.toISOString();
  }

  const buyers = [...buyerMap.values()]
    .map(({ eventIds, happenedIds, ...buyer }) => ({
      ...buyer,
      events: eventIds.size,
      happenedEvents: happenedIds.size,
      upcomingEvents: eventIds.size - happenedIds.size,
    }))
    .sort(
      (a, b) =>
        b.events - a.events ||
        b.lastVisit.localeCompare(a.lastVisit) ||
        a.name.localeCompare(b.name, "nl"),
    );

  const eventList = [...eventMap.values()]
    .map(({ buyerKeys, ...event }) => ({ ...event, buyers: buyerKeys.size }))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  const happenedEvents = eventList.filter((e) => e.happened);
  const upcomingEvents = eventList.filter((e) => !e.happened);
  const sumGuests = (list: VenueVisitEvent[]) =>
    list.reduce((sum, e) => sum + e.guests, 0);

  return {
    totals: {
      events: eventList.length,
      guests: sumGuests(eventList),
      uniqueBuyers: buyers.length,
      returningBuyers: buyers.filter((b) => b.events >= 2).length,
      plusOnes,
      happened: {
        events: happenedEvents.length,
        guests: sumGuests(happenedEvents),
      },
      upcoming: {
        events: upcomingEvents.length,
        guests: sumGuests(upcomingEvents),
      },
    },
    buyers,
    events: eventList,
  };
}

/** Totals, per-buyer list and per-event list for one venue. */
export async function getVenueVisits(venueId: string): Promise<VenueVisits> {
  const rows = await loadVenueVisitRows(eq(eventVenues.venueId, venueId));
  return summarize(rows, new Date());
}

/** Guests and returning buyers per venue, for the venues list. */
export async function getVenueVisitSummaries(): Promise<
  Map<string, Pick<VenueVisitTotals, "guests" | "returningBuyers">>
> {
  const rows = await loadVenueVisitRows(undefined);
  const byVenue = new Map<string, VisitRow[]>();
  for (const row of rows) {
    const list = byVenue.get(row.venueId) ?? [];
    list.push(row);
    byVenue.set(row.venueId, list);
  }
  const now = new Date();
  const result = new Map<
    string,
    Pick<VenueVisitTotals, "guests" | "returningBuyers">
  >();
  for (const [venueId, list] of byVenue) {
    const { totals } = summarize(list, now);
    result.set(venueId, {
      guests: totals.guests,
      returningBuyers: totals.returningBuyers,
    });
  }
  return result;
}

export type CustomerVisit = {
  bookingId: string;
  eventId: string;
  eventName: string;
  city: string;
  startsAt: string;
  venues: { id: string; name: string }[];
  seats: number;
  plusOneName: string | null;
  happened: boolean;
};

export type CustomerVisits = {
  visits: CustomerVisit[];
  totals: {
    events: number;
    venues: number;
    /** Bookings with more than one seat, so they brought someone. */
    timesWithPlusOne: number;
    plusOnes: number;
    plusOneNames: string[];
  };
};

/** Every event this customer has a paid, active booking for, newest first. */
export async function getCustomerVisits(
  customerId: string,
): Promise<CustomerVisits> {
  const db = getDb();
  const rows = await db
    .select({
      bookingId: bookings.id,
      eventId: events.id,
      eventName: events.nameNl,
      city: events.city,
      startsAt: events.startsAt,
      seats: bookings.seats,
      plusOneName: bookings.introPlusOneName,
    })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(and(eq(bookings.customerId, customerId), visitedBooking))
    .orderBy(asc(events.startsAt));

  const eventIds = [...new Set(rows.map((r) => r.eventId))];
  const venueRows =
    eventIds.length > 0
      ? await db
          .select({
            eventId: eventVenues.eventId,
            venueId: venues.id,
            venueName: venues.name,
          })
          .from(eventVenues)
          .innerJoin(venues, eq(venues.id, eventVenues.venueId))
          .where(inArray(eventVenues.eventId, eventIds))
          .orderBy(asc(eventVenues.position))
      : [];
  const venuesByEvent = new Map<string, { id: string; name: string }[]>();
  for (const v of venueRows) {
    const list = venuesByEvent.get(v.eventId) ?? [];
    list.push({ id: v.venueId, name: v.venueName });
    venuesByEvent.set(v.eventId, list);
  }

  const now = new Date();
  const visits = rows
    .map((r) => ({
      bookingId: r.bookingId,
      eventId: r.eventId,
      eventName: r.eventName,
      city: r.city,
      startsAt: r.startsAt.toISOString(),
      venues: venuesByEvent.get(r.eventId) ?? [],
      seats: r.seats,
      plusOneName: cleanName(r.plusOneName),
      happened: r.startsAt < now,
    }))
    .reverse();

  const plusOneNames: string[] = [];
  for (const v of visits) {
    if (v.plusOneName && !plusOneNames.includes(v.plusOneName)) {
      plusOneNames.push(v.plusOneName);
    }
  }

  return {
    visits,
    totals: {
      events: eventIds.length,
      venues: new Set(venueRows.map((v) => v.venueId)).size,
      timesWithPlusOne: visits.filter((v) => v.seats > 1).length,
      plusOnes: visits.reduce((sum, v) => sum + Math.max(v.seats - 1, 0), 0),
      plusOneNames,
    },
  };
}
