import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";

/**
 * Who sat where, what they thought, who they want to see again and who they
 * reported: per person (by email), across every Sunday. Read for the
 * Feedback page, the customer page and the labels on a Sunday's guests.
 * Small enough to read whole.
 */

export type Mood = "great" | "good" | "meh" | "bad";

export type Visit = {
  bookingId: string;
  eventId: string;
  startsAt: string;
  city: string;
  venue: string | null;
  group: number | null;
  noShow: boolean;
  mood: Mood | null;
  venueMood: Mood | null;
};

export type Link = { email: string; name: string; eventId: string; at: string };

export type Person = {
  email: string;
  name: string;
  visits: Visit[];
  /** People they picked under "Wie wil je vaker zien?". */
  wants: Link[];
  /** People they reported ("Laat het ons weten"). */
  reported: Link[];
};

export type TableHistory = Map<string, Person>;

const key = (email: string) => email.trim().toLowerCase();
const first = (name: string | null) => name?.trim().split(/\s+/)[0] || "Gast";

export async function loadTableHistory(): Promise<TableHistory> {
  const db = getDb();
  const [visits, picks, reports] = await Promise.all([
    db.execute<{
      booking_id: string;
      email: string;
      name: string | null;
      event_id: string;
      starts_at: Date;
      city: string;
      venue: string | null;
      group_number: number | null;
      no_show: boolean;
      mood: Mood | null;
      venue_mood: Mood | null;
    }>(sql`
      select b.id as booking_id, b.email, b.customer_name as name, e.id as event_id, e.starts_at, e.city,
        coalesce(fv.name, gv.name, (select v.name from event_venues ev join venues v on v.id = ev.venue_id where ev.event_id = e.id order by ev.position limit 1)) as venue,
        g.number as group_number, b.no_show_at is not null as no_show, f.mood, f.venue_mood
      from bookings b
      join events e on e.id = b.event_id
      left join booking_feedback f on f.booking_id = b.id
      left join venues fv on fv.id = f.venue_id
      left join event_groups g on g.id = b.group_id
      left join venues gv on gv.id = g.venue_id
      where b.payment_status = 'paid' and b.lifecycle_status in ('active', 'transferred') and b.cancelled_late_at is null
        and e.experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      order by e.starts_at desc`),
    db.execute<{ from_email: string; to_email: string; to_name: string | null; event_id: string; at: Date }>(sql`
      select fb.email as from_email, tb.email as to_email, tb.customer_name as to_name, f.event_id, f.updated_at as at
      from booking_feedback f
      join bookings fb on fb.id = f.booking_id
      cross join lateral jsonb_array_elements_text(f.want_to_see) w(id)
      join bookings tb on tb.id::text = w.id`),
    db.execute<{ from_email: string; to_email: string; to_name: string | null; event_id: string; at: Date }>(sql`
      select fb.email as from_email, tb.email as to_email, tb.customer_name as to_name, r.event_id, r.created_at as at
      from feedback_reports r
      join bookings fb on fb.id = r.booking_id
      cross join lateral jsonb_array_elements_text(r.about) a(id)
      join bookings tb on tb.id::text = a.id`),
  ]);

  const people: TableHistory = new Map();
  const person = (email: string, name: string | null) => {
    const k = key(email);
    let p = people.get(k);
    if (!p) {
      p = { email: k, name: first(name), visits: [], wants: [], reported: [] };
      people.set(k, p);
    }
    return p;
  };
  for (const v of visits) {
    person(v.email, v.name).visits.push({
      bookingId: v.booking_id,
      eventId: v.event_id,
      startsAt: new Date(v.starts_at).toISOString(),
      city: v.city,
      venue: v.venue,
      group: v.group_number,
      noShow: v.no_show,
      mood: v.mood,
      venueMood: v.venue_mood,
    });
  }
  const link = (r: { to_email: string; to_name: string | null; event_id: string; at: Date }): Link => ({
    email: key(r.to_email),
    name: first(r.to_name),
    eventId: r.event_id,
    at: new Date(r.at).toISOString(),
  });
  for (const r of picks) person(r.from_email, null).wants.push(link(r));
  for (const r of reports) person(r.from_email, null).reported.push(link(r));
  return people;
}

/** Who picked this person, and who reported them. */
export function inbound(history: TableHistory, email: string): { wantedBy: Link[]; reportedBy: Link[] } {
  const k = key(email);
  const wantedBy: Link[] = [];
  const reportedBy: Link[] = [];
  for (const p of history.values()) {
    for (const w of p.wants) if (w.email === k) wantedBy.push({ ...w, email: p.email, name: p.name });
    for (const r of p.reported) if (r.email === k) reportedBy.push({ ...r, email: p.email, name: p.name });
  }
  return { wantedBy, reportedBy };
}

/** Labels for one guest on a Sunday: how often they came before, how the last
 * one was, and who at this Sunday they picked, were picked by, reported or
 * were reported by. */
export type GuestHistory = {
  before: number;
  lastMood: Mood | null;
  wants: string[];
  wantedBy: string[];
  reported: string[];
  reportedBy: string[];
};

export function guestHistories(
  history: TableHistory,
  eventId: string,
  startsAt: Date,
  guests: { bookingId: string; email: string }[],
): Record<string, GuestHistory> {
  const here = new Set(guests.map((g) => key(g.email)));
  const nameOf = (email: string) => history.get(email)?.name ?? "Gast";
  const out: Record<string, GuestHistory> = {};
  for (const g of guests) {
    const k = key(g.email);
    const p = history.get(k);
    const earlier = (p?.visits ?? []).filter((v) => v.eventId !== eventId && v.startsAt < startsAt.toISOString() && !v.noShow);
    const { wantedBy, reportedBy } = inbound(history, k);
    const uniq = (links: Link[]) => [...new Set(links.filter((l) => here.has(l.email) && l.email !== k).map((l) => nameOf(l.email)))];
    out[g.bookingId] = {
      before: earlier.length,
      lastMood: earlier.find((v) => v.mood)?.mood ?? null,
      wants: uniq(p?.wants ?? []),
      wantedBy: uniq(wantedBy),
      reported: uniq(p?.reported ?? []),
      reportedBy: uniq(reportedBy),
    };
  }
  return out;
}
