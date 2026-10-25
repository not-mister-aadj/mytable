import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { plannedFor } from "@/lib/admin/sunday-mails";
import { getDb } from "@/db/index";
import { eventGroups, eventVenues, events, jouwTafelPauses, venues } from "@/db/schema";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { QUIZ_METADATA_KEY, ageFromBirthDate, girlsOnlyWish, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { calendarState, monthGrid, type CalendarState } from "@/lib/jouw-tafel/groups-logic";
import { seriesStartsAt } from "@/lib/jouw-tafel/series-server";
import { bookingOpensOverride, jouwTafelBookingWindow } from "@/lib/jouw-tafel/logic";
import { parseVenuePicks, type VenuePick } from "@/lib/venue-picks";

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
  /** A hand-made Sunday Social (not planned by the series): it is managed
   * on the "Sunday Social" tab, not on a table board. */
  handMade: boolean;
};

export type CalendarMonth = {
  weeks: string[][];
  items: CalendarItem[];
  pauses: { startsOn: string; endsOn: string; label: string | null }[];
  cities: string[];
};

/** Every Sunday Social in the weeks of a month view: the tables the series
 * planned and the hand-made ones (one event per city per Sunday). */
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
          inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE]),
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
    db
      .selectDistinct({ city: events.city })
      .from(events)
      .where(inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE])),
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
    items: rows.map((r) => {
      const handMade = r.experienceType === SUNDAY_SOCIAL_TYPE;
      const comingSoon = Boolean(r.extras?.comingSoon);
      return {
        id: r.id,
        city: r.city,
        date: amsterdamDateIso(r.startsAt),
        startsAt: r.startsAt.toISOString(),
        capacity: r.capacity,
        spotsSold: r.spotsSold,
        // A hand-made one has no booking window and never closes empty: it
        // is open from the moment it is published.
        state: handMade
          ? r.spotsSold >= r.capacity
            ? ("full" as const)
            : comingSoon
              ? ("not_yet" as const)
              : ("bookable" as const)
          : calendarState(
              { startsAt: r.startsAt, capacity: r.capacity, spotsSold: r.spotsSold, comingSoon, bookingOpensAt: bookingOpensOverride(r.extras) },
              now,
            ),
        venueCount: venueCount.get(r.id) ?? 0,
        final: Boolean(r.groupsFinalAt),
        handMade,
      };
    }),
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
  /** "similar" (around their age) or "any" (all ages): asked at booking,
   * else the quiz's "does age matter"; null when unknown. */
  agePreference: "similar" | "any" | null;
  language: string | null;
  dietary: string | null;
  /** Ladies only: "strict", or "mixed_ok" when a mixed table is fine if it
   * does not work out; null without the wish. */
  ladies: "strict" | "mixed_ok" | null;
  groupId: string | null;
  email: string;
  plusOneName: string | null;
  /** Cancelled on the table page: when, our note, and the Sunday mails
   * still planned for them at Resend. Null when they are coming. */
  cancelled: { at: string; note: string; plannedMails: string[] } | null;
  /** The "meet your table" answers, all of them (admin only). */
  intro: {
    answered: boolean;
    shared: boolean;
    conversationStyle: string | null;
    askMeAbout: string | null;
    favoriteSpot: string | null;
    intoNow: string | null;
    wine: string | null;
  };
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
    /** An admin opened it for everyone early (extras.bookingOpensAt). */
    openedEarly: boolean;
    /** Everyone (not just members) can book it now. */
    openForEveryone: boolean;
    /** Within two days: a venue without picks needs them now. */
    picksDueSoon: boolean;
  };
  venues: { id: string; name: string; address: string | null; picks: VenuePick[] }[];
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
  birth_date: string | null;
  age_preference: string | null;
  intro_plus_one_name: string | null;
  intro_conversation_style: string | null;
  intro_ask_me_about: string | null;
  intro_favorite_spot: string | null;
  intro_into_now: string | null;
  intro_wine: string | null;
  intro_share_consent: boolean;
  intro_answered_at: string | null;
  cancelled_late_at: string | null;
  cancel_note: string | null;
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
    .where(and(eq(events.id, eventId), inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE])))
    .limit(1);
  if (!event) return null;

  const [linked, groupRows, guestRows, cityVenues] = await Promise.all([
    db
      .select({ id: venues.id, name: venues.name, address: venues.address, picks: venues.picks })
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
             b.table_language_preference, b.birth_date::text as birth_date, b.age_preference,
             b.intro_plus_one_name, b.intro_conversation_style, b.intro_ask_me_about, b.intro_favorite_spot,
             b.intro_into_now, b.intro_wine, b.intro_share_consent, b.intro_answered_at::text as intro_answered_at,
             to_char(b.cancelled_late_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as cancelled_late_at, b.cancel_note,
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
    // The birth date given at booking, else the one from the quiz.
    const birthDate = g.birth_date ?? answers.birthDate;
    const age = birthDate ? ageFromBirthDate(birthDate, now) : null;
    const agePreference =
      g.age_preference === "similar" || g.age_preference === "any"
        ? g.age_preference
        : answers.ageMatters === "yes"
          ? "similar"
          : answers.ageMatters === "no"
            ? "any"
            : null;
    return {
      bookingId: g.id,
      name: g.customer_name?.trim() || answers.name?.trim() || g.email.split("@")[0]!,
      seats: g.seats,
      member: Boolean(g.membership_id),
      firstTime: g.earlier === 0,
      age: age,
      agePreference,
      language: answers.language ?? g.table_language_preference ?? null,
      dietary: g.dietary_notes?.trim() || null,
      ladies: girlsOnlyWish(answers),
      groupId: g.group_id,
      email: g.email,
      plusOneName: g.seats >= 2 ? g.intro_plus_one_name?.trim() || null : null,
      cancelled: g.cancelled_late_at
        ? { at: g.cancelled_late_at, note: g.cancel_note ?? "", plannedMails: plannedFor(event.extras?.mailSchedule, g.id, now) }
        : null,
      intro: (() => {
        const text = (v: string | null) => v?.trim() || null;
        const answered = Boolean(
          g.intro_answered_at ||
            g.intro_wine ||
            g.intro_conversation_style ||
            [g.intro_ask_me_about, g.intro_favorite_spot, g.intro_into_now].some((v) => v?.trim()),
        );
        return {
          answered,
          shared: answered && g.intro_share_consent,
          conversationStyle: g.intro_conversation_style,
          askMeAbout: text(g.intro_ask_me_about),
          favoriteSpot: text(g.intro_favorite_spot),
          intoNow: text(g.intro_into_now),
          wine: g.intro_wine,
        };
      })(),
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
        { startsAt: event.startsAt, capacity: event.capacity, spotsSold: event.spotsSold, comingSoon: Boolean(event.extras?.comingSoon), bookingOpensAt: bookingOpensOverride(event.extras) },
        now,
      ),
      finalAt: event.groupsFinalAt?.toISOString() ?? null,
      openedEarly: Boolean(bookingOpensOverride(event.extras)),
      picksDueSoon: event.startsAt.getTime() - now < 2 * 86_400_000,
      openForEveryone:
        !event.extras?.comingSoon &&
        now >= Math.max(
          jouwTafelBookingWindow(event.startsAt, bookingOpensOverride(event.extras)).everyoneFrom.getTime(),
          event.membersOnlyUntil?.getTime() ?? 0,
        ),
    },
    venues: linked.map((v) => ({ ...v, picks: parseVenuePicks(v.picks) })),
    groups: groupRows,
    guests,
    venueChoices: cityVenues.filter((v) => !linkedIds.has(v.id)),
  };
}
