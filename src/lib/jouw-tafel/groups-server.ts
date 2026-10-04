import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { eventGroups, eventVenues, events, jouwTafelPauses, venues } from "@/db/schema";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { QUIZ_METADATA_KEY, ageFromBirthDate, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { calendarState, monthGrid, type CalendarState } from "@/lib/jouw-tafel/groups-logic";
import { seriesStartsAt } from "@/lib/jouw-tafel/series-server";

// ---------------------------------------------------------------- calendar

export type CalendarItem = {
  id: string;
  city: string;
  date: string;
  startsAt: string;
  capacity: number;
  spotsSold: number;
  state: CalendarState;
  venueCount: number;
  final: boolean;
};

export type CalendarMonth = {
  weeks: string[][];
  items: CalendarItem[];
  pauses: { startsOn: string; endsOn: string; label: string | null }[];
  cities: string[];
};

/** Every "Jouw tafel" Sunday Table in the weeks of a month view. */
export async function loadCalendarMonth(year: number, month: number, now = Date.now()): Promise<CalendarMonth> {
  const db = getDb();
  const weeks = monthGrid(year, month);
  const first = weeks[0]![0]!;
  const last = weeks[weeks.length - 1]![6]!;
  const [rows, pauseRows, cityRows] = await Promise.all([
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.experienceType, JOUW_TAFEL_TYPE),
          eq(events.workflowStatus, "published"),
          gte(events.startsAt, seriesStartsAt(first, "00:00")),
          lte(events.startsAt, seriesStartsAt(last, "23:59")),
        ),
      )
      .orderBy(asc(events.startsAt), asc(events.city)),
    db
      .select()
      .from(jouwTafelPauses)
      .where(and(lte(jouwTafelPauses.startsOn, last), gte(jouwTafelPauses.endsOn, first))),
    db.selectDistinct({ city: events.city }).from(events).where(eq(events.experienceType, JOUW_TAFEL_TYPE)),
  ]);
  const counts =
    rows.length > 0
      ? await db
          .select({ eventId: eventVenues.eventId, n: sql<number>`count(*)::int` })
          .from(eventVenues)
          .where(inArray(eventVenues.eventId, rows.map((r) => r.id)))
          .groupBy(eventVenues.eventId)
      : [];
  const venueCount = new Map(counts.map((c) => [c.eventId, c.n]));
  return {
    weeks,
    items: rows.map((r) => ({
      id: r.id,
      city: r.city,
      date: amsterdamDateIso(r.startsAt),
      startsAt: r.startsAt.toISOString(),
      capacity: r.capacity,
      spotsSold: r.spotsSold,
      state: calendarState(
        { startsAt: r.startsAt, capacity: r.capacity, spotsSold: r.spotsSold, comingSoon: Boolean(r.extras?.comingSoon) },
        now,
      ),
      venueCount: venueCount.get(r.id) ?? 0,
      final: Boolean(r.groupsFinalAt),
    })),
    pauses: pauseRows.map((p) => ({ startsOn: p.startsOn, endsOn: p.endsOn, label: p.label })),
    cities: [...new Set(cityRows.map((c) => c.city))].sort((a, b) => a.localeCompare(b, "nl")),
  };
}

// ------------------------------------------------------------------- board

export type BoardGuest = {
  bookingId: string;
  name: string;
  seats: number;
  member: boolean;
  firstTime: boolean;
  age: number | null;
  language: string | null;
  dietary: string | null;
  groupId: string | null;
};

export type BoardGroup = { id: string; venueId: string; number: number };

export type EventBoard = {
  event: {
    id: string;
    slug: string;
    city: string;
    startsAt: string;
    capacity: number;
    spotsSold: number;
    state: CalendarState;
    finalAt: string | null;
  };
  venues: { id: string; name: string; address: string | null }[];
  groups: BoardGroup[];
  guests: BoardGuest[];
  /** Venues in the same city that can still be added. */
  venueChoices: { id: string; name: string }[];
};

type GuestRow = {
  id: string;
  customer_name: string | null;
  email: string;
  seats: number;
  membership_id: string | null;
  group_id: string | null;
  dietary_notes: string | null;
  table_language_preference: string | null;
  earlier: number;
  quiz: unknown;
};

/** One Sunday Table with its venues, groups and paid guests (a 2-seat
 * booking is one guest with two seats). Null when it is not one. */
export async function loadEventBoard(eventId: string, now = Date.now()): Promise<EventBoard | null> {
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.experienceType, JOUW_TAFEL_TYPE)))
    .limit(1);
  if (!event) return null;

  const [linked, groupRows, guestRows, cityVenues] = await Promise.all([
    db
      .select({ id: venues.id, name: venues.name, address: venues.address })
      .from(eventVenues)
      .innerJoin(venues, eq(eventVenues.venueId, venues.id))
      .where(eq(eventVenues.eventId, eventId))
      .orderBy(asc(eventVenues.position)),
    db
      .select({ id: eventGroups.id, venueId: eventGroups.venueId, number: eventGroups.number })
      .from(eventGroups)
      .where(eq(eventGroups.eventId, eventId))
      .orderBy(asc(eventGroups.number)),
    db.execute(sql`
      select b.id, b.customer_name, b.email, b.seats, b.membership_id, b.group_id, b.dietary_notes,
             b.table_language_preference,
             (select count(*) from bookings p join events pe on pe.id = p.event_id
               where lower(p.email) = lower(b.email) and p.payment_status = 'paid'
                 and pe.starts_at < ${event.startsAt.toISOString()}::timestamptz)::int as earlier,
             (select u.raw_user_meta_data -> ${QUIZ_METADATA_KEY} from auth.users u
               where lower(u.email) = lower(b.email) limit 1) as quiz
      from bookings b
      where b.event_id = ${eventId}
        and b.payment_status = 'paid'
        and b.lifecycle_status in ('active', 'transferred')
      order by b.created_at
    `) as unknown as Promise<GuestRow[]>,
    db
      .select({ id: venues.id, name: venues.name })
      .from(venues)
      .where(sql`lower(${venues.city}) = lower(${event.city})`)
      .orderBy(asc(venues.name)),
  ]);

  const guests: BoardGuest[] = guestRows.map((g) => {
    const answers = sanitizeQuizState(g.quiz).answers;
    const age = answers.birthDate ? ageFromBirthDate(answers.birthDate, now) : null;
    return {
      bookingId: g.id,
      name: g.customer_name?.trim() || answers.name?.trim() || g.email.split("@")[0]!,
      seats: g.seats,
      member: Boolean(g.membership_id),
      firstTime: g.earlier === 0,
      age: age,
      language: answers.language ?? g.table_language_preference ?? null,
      dietary: g.dietary_notes?.trim() || null,
      groupId: g.group_id,
    };
  });

  const linkedIds = new Set(linked.map((v) => v.id));
  return {
    event: {
      id: event.id,
      slug: event.slug,
      city: event.city,
      startsAt: event.startsAt.toISOString(),
      capacity: event.capacity,
      spotsSold: event.spotsSold,
      state: calendarState(
        { startsAt: event.startsAt, capacity: event.capacity, spotsSold: event.spotsSold, comingSoon: Boolean(event.extras?.comingSoon) },
        now,
      ),
      finalAt: event.groupsFinalAt?.toISOString() ?? null,
    },
    venues: linked,
    groups: groupRows,
    guests,
    venueChoices: cityVenues.filter((v) => !linkedIds.has(v.id)),
  };
}
