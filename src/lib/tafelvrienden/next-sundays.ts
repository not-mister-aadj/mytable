import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { citiesForEmail } from "@/lib/invites/cities";
import { declinedEventIds } from "@/lib/invites/declines";
import { bookedMatches } from "@/lib/invites/engine";
import { fitsBracket } from "@/lib/invites/logic";
import { bracketFromEventName, jouwTafelBookingWindow, memberBookingOpensAt, supportedCity } from "@/lib/jouw-tafel/logic";
import { loadMutualMatches } from "@/lib/tafelvrienden/server";

const DAY = 86_400_000;
/** Booking closes 48 hours before the start. */
const CLOSE_MS = 2 * DAY;

export type NextSunday = {
  eventId: string;
  city: string;
  startsAt: Date;
  /** First names of mutual matches who booked it and ticked "laat mijn tafelvrienden weten". */
  friends: string[];
};

export type Candidate = {
  eventId: string;
  city: string;
  startsAt: Date;
  capacity: number;
  sold: number;
  heldBack: boolean;
  everyoneFrom: Date;
  membersFrom: Date;
  bracket: "20-39" | "35+" | null;
};

/**
 * The Sundays for "Ze vonden je gezellig", from the open ones (pure, for
 * tests): `next` is the soonest in the city of the Sunday they were at;
 * `friend` is the soonest in a city they follow where a tafelvriend comes,
 * left out when it is the same Sunday as `next` (that one then carries the
 * names). Both null when they already booked a coming Sunday.
 */
export function pickNextSundays(input: {
  now: Date;
  city: string;
  followed: string[];
  member: boolean;
  bookedAhead: boolean;
  declined: Set<string>;
  person: { birthDate: Date | null; ageRange: string | null };
  candidates: Candidate[];
  friendsOf: Map<string, string[]>;
}): { next: NextSunday | null; friend: NextSunday | null } {
  if (input.bookedAhead) return { next: null, friend: null };
  const open = input.candidates
    .filter((c) => !c.heldBack && c.sold < c.capacity)
    .filter((c) => c.startsAt.getTime() - CLOSE_MS > input.now.getTime())
    .filter((c) => (input.member ? c.membersFrom : c.everyoneFrom).getTime() <= input.now.getTime())
    .filter((c) => !input.declined.has(c.eventId))
    .filter((c) => fitsBracket(c.bracket, input.person, c.startsAt.toISOString()))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const as = (c: Candidate): NextSunday => ({ eventId: c.eventId, city: c.city, startsAt: c.startsAt, friends: input.friendsOf.get(c.eventId) ?? [] });
  const nextC = open.find((c) => c.city === input.city) ?? null;
  const cities = new Set([input.city, ...input.followed]);
  const friendC = open.find((c) => cities.has(c.city) && (input.friendsOf.get(c.eventId)?.length ?? 0) > 0) ?? null;
  const next = nextC ? as(nextC) : null;
  const friend = friendC && friendC.eventId !== nextC?.eventId ? as(friendC) : null;
  return { next, friend };
}

/** pickNextSundays with everything loaded for one guest. */
export async function nextSundaysFor(input: { email: string; city: string; member: boolean; now?: Date }): Promise<{ next: NextSunday | null; friend: NextSunday | null }> {
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  const db = getDb();
  const [ahead, rows, person, prefs, followed, declined] = await Promise.all([
    db.execute(sql`
      select 1 as x from bookings b join events e on e.id = b.event_id
      where lower(trim(b.email)) = ${email} and b.payment_status = 'paid' and b.lifecycle_status = 'active'
        and b.cancelled_late_at is null and e.starts_at > ${now.toISOString()}::timestamptz
        and e.experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      limit 1`) as unknown as Promise<Array<{ x: number }>>,
    db.execute(sql`
      select e.id, e.city, e.starts_at, e.capacity, e.extras, e.name_nl,
        (select coalesce(sum(b.seats), 0) from bookings b
          where b.event_id = e.id and b.payment_status = 'paid' and b.lifecycle_status = 'active')::int as sold
      from events e
      where e.workflow_status = 'published' and e.experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
        and e.starts_at > ${new Date(now.getTime() + CLOSE_MS).toISOString()}::timestamptz`) as unknown as Promise<
      Array<{ id: string; city: string; starts_at: string | Date; capacity: number; extras: Record<string, unknown> | null; name_nl: string | null; sold: number }>
    >,
    db.execute(sql`
      select (select max(birth_date) from bookings where lower(trim(email)) = ${email}) as birth_date,
        (select preferences->'ageRange'->>0 from waitlist_signups where lower(email) = ${email} and preferences ? 'ageRange' order by created_at desc limit 1) as age_range`) as unknown as Promise<
      Array<{ birth_date: string | Date | null; age_range: string | null }>
    >,
    db.execute(sql`select city_prefs from invite_subscribers where email_normalized = ${email}`) as unknown as Promise<Array<{ city_prefs: Record<string, string> | null }>>,
    citiesForEmail(email),
    declinedEventIds(email),
  ]);
  const off = new Set(Object.entries(prefs[0]?.city_prefs ?? {}).filter(([, v]) => v === "none").map(([c]) => c));
  const city = supportedCity(input.city) ?? input.city;
  const candidates: Candidate[] = rows.map((r) => {
    const startsAt = new Date(r.starts_at);
    const opensAt = typeof r.extras?.bookingOpensAt === "string" ? (r.extras.bookingOpensAt as string) : null;
    return {
      eventId: r.id,
      city: supportedCity(r.city) ?? r.city,
      startsAt,
      capacity: r.capacity,
      sold: Number(r.sold),
      heldBack: Boolean(r.extras?.comingSoon),
      everyoneFrom: jouwTafelBookingWindow(startsAt.toISOString(), opensAt).everyoneFrom,
      membersFrom: memberBookingOpensAt(startsAt, opensAt),
      bracket: bracketFromEventName(r.name_nl ?? ""),
    };
  });
  // Names only for Sundays that could be shown at all.
  const cities = new Set([city, ...followed.filter((c) => !off.has(c))]);
  const mutual = await loadMutualMatches();
  const friendsOf = new Map<string, string[]>();
  if ((mutual.get(email)?.size ?? 0) > 0) {
    for (const c of candidates) {
      if (!cities.has(c.city)) continue;
      const { names } = await bookedMatches(email, c.eventId, mutual);
      if (names.length > 0) friendsOf.set(c.eventId, names);
    }
  }
  const p = person[0];
  return pickNextSundays({
    now,
    city,
    followed: [...cities],
    member: input.member,
    bookedAhead: ahead.length > 0,
    declined,
    person: { birthDate: p?.birth_date ? new Date(p.birth_date) : null, ageRange: p?.age_range ?? null },
    candidates,
    friendsOf,
  });
}
