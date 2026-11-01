import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { DISLIKED_LABELS, LIKED_LABELS, type DislikedReason, type LikedReason } from "@/lib/feedback-reasons";

/** The Feedback page in admin: how we score, per city and per bar, and every answer. */

type Mood = "great" | "good" | "meh" | "bad";
const REBOOK_DAYS = 60;

export type FeedbackPeriod = "30" | "90" | "all";

export type Score = {
  sundays: number;
  guests: number;
  /** Guests whose Sunday had the feedback mail. */
  mailed: number;
  answered: number;
  /** NPS on "Hoe was het gezelschap?": Geweldig promotes, Leuk is neutral, Matig and Niet leuk detract. */
  promoters: number;
  detractors: number;
  /** Bar ratings (1 to 5 stars) and their sum, for the average. */
  venueRated: number;
  venueStars: number;
  /** Picked at least one tablemate. */
  picked: number;
  mutual: number;
  /** All guests, of them who booked again within REBOOK_DAYS so far, and how many are still inside that window. */
  rebookBase: number;
  rebooked: number;
  rebookOpen: number;
  reports: number;
};

export type FeedbackListRow = {
  bookingId: string;
  customerId: string | null;
  eventId: string;
  name: string;
  startsAt: string;
  city: string;
  venue: string | null;
  group: number | null;
  mood: Mood | null;
  venueMood: Mood | null;
  venueRating: number | null;
  wants: string[];
  liked: string[];
  disliked: string[];
  highlight: string | null;
  improve: string | null;
  reported: boolean;
  next: NextBooking | null;
};

/** Their first booking for a later Sunday, and how it came about. */
export type NextBooking = { startsAt: string; city: string; how: "ticket" | "member" | "free"; early: boolean };

export type FeedbackOverview = {
  cities: string[];
  total: Score;
  perCity: (Score & { city: string })[];
  perVenue: (Score & { venue: string; city: string })[];
  rows: FeedbackListRow[];
};

type VisitRow = {
  booking_id: string;
  email: string;
  name: string | null;
  customer_id: string | null;
  event_id: string;
  starts_at: Date;
  city: string;
  venue: string | null;
  group_number: number | null;
  mood: Mood | null;
  venue_mood: Mood | null;
  venue_rating: number | null;
  liked: string[] | null;
  disliked: string[] | null;
  highlight: string | null;
  improve: string | null;
  want_names: string[] | null;
  want_ids: string[] | null;
  mailed: boolean;
  rebooked: boolean;
  next: { starts_at: string; city: string; member: boolean; free: boolean; early: boolean } | null;
  reports: number;
};

function emptyScore(): Score {
  return { sundays: 0, guests: 0, mailed: 0, answered: 0, promoters: 0, detractors: 0, venueRated: 0, venueStars: 0, picked: 0, mutual: 0, rebookBase: 0, rebooked: 0, rebookOpen: 0, reports: 0 };
}

export async function loadFeedbackOverview(period: FeedbackPeriod, city: string | null, now = new Date()): Promise<FeedbackOverview> {
  const since = period === "all" ? new Date(0) : new Date(now.getTime() - Number(period) * 86_400_000);
  const rows = await getDb().execute<VisitRow>(sql`
    select b.id as booking_id, b.email, b.customer_name as name, c.id as customer_id, e.id as event_id, e.starts_at, e.city,
      coalesce(fv.name, gv.name, (select v.name from event_venues ev join venues v on v.id = ev.venue_id where ev.event_id = e.id order by ev.position limit 1)) as venue,
      g.number as group_number, f.mood, f.venue_mood, f.venue_rating, f.liked, f.disliked, f.highlight, f.improve,
      (select array_agg(split_part(coalesce(tb.customer_name, 'Gast'), ' ', 1)) from jsonb_array_elements_text(coalesce(f.want_to_see, '[]'::jsonb)) w(id) join bookings tb on tb.id::text = w.id) as want_names,
      (select array_agg(w.id) from jsonb_array_elements_text(coalesce(f.want_to_see, '[]'::jsonb)) w(id)) as want_ids,
      exists (select 1 from email_log l where l.email_normalized = lower(trim(b.email)) and l.sent_at > e.starts_at
        and (l.subject ilike 'hoe was het vanmiddag%' or l.subject ilike 'how was this afternoon%' or l.subject ilike '%hoe was je middag%' or l.subject ilike '%how was your afternoon%')) as mailed,
      exists (select 1 from bookings nb join events ne on ne.id = nb.event_id where lower(nb.email) = lower(b.email) and nb.id <> b.id
        and nb.payment_status = 'paid' and ne.starts_at > e.starts_at
        and nb.created_at < e.starts_at + make_interval(days => ${REBOOK_DAYS})) as rebooked,
      (select json_build_object('starts_at', ne.starts_at, 'city', ne.city, 'member', nb.membership_id is not null, 'free', nb.amount_cents = 0, 'early', nb.created_at < e.starts_at)
        from bookings nb join events ne on ne.id = nb.event_id
        where lower(nb.email) = lower(b.email) and nb.id <> b.id and nb.payment_status = 'paid' and nb.lifecycle_status = 'active' and ne.starts_at > e.starts_at
        order by ne.starts_at limit 1) as next,
      (select count(*)::int from feedback_reports r where r.booking_id = b.id) as reports
    from bookings b
    join events e on e.id = b.event_id
    left join customers c on c.email_normalized = lower(trim(b.email))
    left join booking_feedback f on f.booking_id = b.id
    left join venues fv on fv.id = f.venue_id
    left join event_groups g on g.id = b.group_id
    left join venues gv on gv.id = g.venue_id
    where b.payment_status = 'paid' and b.lifecycle_status in ('active', 'transferred') and b.cancelled_late_at is null and b.no_show_at is null
      and e.experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      and e.starts_at < ${now.toISOString()}::timestamptz and e.starts_at >= ${since.toISOString()}::timestamptz
    order by e.starts_at desc, b.customer_name`);

  const cities = [...new Set(rows.map((r) => r.city))].sort();
  const scoped = city ? rows.filter((r) => r.city === city) : rows;
  // Mutual: they picked someone at their Sunday who picked them back.
  const picksOf = new Map(scoped.map((r) => [r.booking_id, new Set(r.want_ids ?? [])]));
  const isMutual = (r: VisitRow) => (r.want_ids ?? []).some((id) => picksOf.get(id)?.has(r.booking_id));
  const rebookOpen = (r: VisitRow) => !r.rebooked && new Date(r.starts_at).getTime() >= now.getTime() - REBOOK_DAYS * 86_400_000;

  const tally = (list: VisitRow[]): Score => {
    const s = emptyScore();
    s.sundays = new Set(list.map((r) => r.event_id)).size;
    for (const r of list) {
      s.guests++;
      if (r.mailed || r.mood) s.mailed++;
      if (r.mood) {
        s.answered++;
        if (r.mood === "great") s.promoters++;
        if (r.mood === "meh" || r.mood === "bad") s.detractors++;
      }
      if (r.venue_rating) {
        s.venueRated++;
        s.venueStars += r.venue_rating;
      }
      if ((r.want_ids ?? []).length > 0) s.picked++;
      if (isMutual(r)) s.mutual++;
      s.rebookBase++;
      if (r.rebooked) s.rebooked++;
      if (rebookOpen(r)) s.rebookOpen++;
      s.reports += r.reports;
    }
    return s;
  };
  const group = <K extends string>(by: (r: VisitRow) => K | null) => {
    const m = new Map<K, VisitRow[]>();
    for (const r of scoped) {
      const k = by(r);
      if (k) m.set(k, [...(m.get(k) ?? []), r]);
    }
    return m;
  };

  return {
    cities,
    total: tally(scoped),
    perCity: [...group((r) => r.city)].map(([c, list]) => ({ city: c, ...tally(list) })).sort((a, b) => b.guests - a.guests),
    perVenue: [...group((r) => (r.venue ? `${r.venue}|${r.city}` : null))]
      .map(([k, list]) => ({ venue: k.split("|")[0]!, city: k.split("|")[1]!, ...tally(list) }))
      .sort((a, b) => b.guests - a.guests),
    rows: scoped
      .filter((r) => r.mood || r.reports > 0)
      .map((r) => ({
        bookingId: r.booking_id,
        customerId: r.customer_id,
        eventId: r.event_id,
        name: r.name?.trim() || r.email,
        startsAt: new Date(r.starts_at).toISOString(),
        city: r.city,
        venue: r.venue,
        group: r.group_number,
        mood: r.mood,
        venueMood: r.venue_mood,
        venueRating: r.venue_rating,
        wants: r.want_names ?? [],
        liked: (r.liked ?? []).map((k) => LIKED_LABELS.nl[k as LikedReason] ?? k),
        disliked: (r.disliked ?? []).map((k) => DISLIKED_LABELS.nl[k as DislikedReason] ?? k),
        highlight: r.highlight,
        improve: r.improve,
        reported: r.reports > 0,
        next: r.next
          ? { startsAt: new Date(r.next.starts_at).toISOString(), city: r.next.city, how: r.next.member ? "member" : r.next.free ? "free" : "ticket", early: r.next.early }
          : null,
      })),
  };
}

/** -100 to +100: share of promoters minus share of detractors; null without answers. */
export function nps(s: Pick<Score, "answered" | "promoters" | "detractors">): number | null {
  return s.answered ? Math.round(((s.promoters - s.detractors) / s.answered) * 100) : null;
}

/** Average bar stars, or null without ratings. */
export const avgStars = (s: Pick<Score, "venueRated" | "venueStars">) => (s.venueRated ? s.venueStars / s.venueRated : null);
