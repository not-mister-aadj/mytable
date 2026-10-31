import { notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { adminTodos } from "@/db/schema";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { monthlyTargetCents } from "@/lib/admin/monthly-target";
import { LOCATION_SUBJECT_SQL } from "@/lib/admin/sunday-mails";

/** Everything the "Vandaag" page shows, in one round of queries. */

export type UpcomingSunday = {
  id: string;
  city: string;
  startsAt: string;
  /** The bars linked to this Sunday, in order. */
  venueNames: string[];
  /** The newest note about this Sunday's bar. */
  lastNote: { body: string; createdAt: string } | null;
  capacity: number;
  seatsSold: number;
  guests: number;
  /** Guests whose open questions are still empty. */
  questionsOpen: number;
  /** Guests who got the location mail for this Sunday. */
  locationSent: number;
  /** Guests who got the Saturday mail (group, tablemates, our picks). */
  saturdaySent: number;
  notifyWaiting: number;
  /** Whole days from today (Amsterdam) to the Sunday. */
  daysUntil: number;
};

export type TodoItem = {
  key: string;
  tone: "urgent" | "soon" | "info";
  title: string;
  detail: string;
  href: string;
  /** When this item first came up (ISO). */
  since: string;
};

export type TodayData = {
  sundays: UpcomingSunday[];
  todos: TodoItem[];
  /** Clicked away and unchanged since. */
  dismissed: TodoItem[];
  month: { label: string; revenueCents: number; seats: number; targetCents: number | null };
  recentBookings: Array<{ id: string; name: string; city: string; startsAt: string; createdAt: string; seats: number }>;
};

const SATURDAY_SUBJECT = `(subject ilike '%groep %' or subject ilike '%group %' or subject ilike '%aanraders%' or subject ilike '%our picks%')`;

function amsterdamDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(date);
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${fromIso}T12:00:00Z`)) / 86_400_000);
}

export async function getTodayData(eventHref: (id: string, tab?: string) => string, now = new Date()): Promise<TodayData> {
  const db = getDb();
  const today = amsterdamDay(now);

  const sundayRows = await db.execute<{
    id: string;
    city: string;
    starts_at: Date;
    venue_names: string[] | null;
    last_note: string | null;
    last_note_at: Date | null;
    capacity: number;
    seats_sold: number;
    guests: number;
    questions_open: number;
    location_sent: number;
    saturday_sent: number;
    notify_waiting: number;
  }>(sql.raw(`
    select e.id, e.city, e.starts_at, e.capacity,
      (select array_agg(v.name order by ev.position) from event_venues ev join venues v on v.id = ev.venue_id where ev.event_id = e.id) as venue_names,
      (select n.body from venue_notes n where n.event_id = e.id order by n.created_at desc limit 1) as last_note,
      (select max(n.created_at) from venue_notes n where n.event_id = e.id) as last_note_at,
      coalesce(sum(b.seats), 0)::int as seats_sold,
      count(b.id)::int as guests,
      count(b.id) filter (where coalesce(nullif(trim(b.intro_ask_me_about), ''), nullif(trim(b.intro_favorite_spot), ''), nullif(trim(b.intro_into_now), '')) is null)::int as questions_open,
      count(b.id) filter (where exists (
        select 1 from email_log l where l.email_normalized = lower(trim(b.email))
          and l.sent_at > e.starts_at - interval '10 days' and ${LOCATION_SUBJECT_SQL}))::int as location_sent,
      count(b.id) filter (where exists (
        select 1 from email_log l where l.email_normalized = lower(trim(b.email))
          and l.sent_at > e.starts_at - interval '4 days' and ${SATURDAY_SUBJECT}))::int as saturday_sent,
      (select count(*) from event_notify_signups n where n.event_id = e.id and n.notified_at is null)::int as notify_waiting
    from events e
    left join bookings b on b.event_id = e.id and b.payment_status = 'paid' and b.lifecycle_status = 'active'
    where e.workflow_status = 'published'
      and e.experience_type in ('${SUNDAY_SOCIAL_TYPE}', '${JOUW_TAFEL_TYPE}')
      and e.starts_at > now() - interval '6 hours'
    group by e.id
    order by e.starts_at
    limit 8
  `));

  const sundays: UpcomingSunday[] = sundayRows.map((r) => ({
    id: r.id,
    city: r.city,
    startsAt: new Date(r.starts_at).toISOString(),
    venueNames: r.venue_names ?? [],
    lastNote: r.last_note && r.last_note_at ? { body: r.last_note, createdAt: new Date(r.last_note_at).toISOString() } : null,
    capacity: r.capacity,
    seatsSold: r.seats_sold,
    guests: r.guests,
    questionsOpen: r.questions_open,
    locationSent: r.location_sent,
    saturdaySent: r.saturday_sent,
    notifyWaiting: r.notify_waiting,
    daysUntil: daysBetween(today, amsterdamDay(new Date(r.starts_at))),
  }));

  const todos: Omit<TodoItem, "since">[] = [];
  const dayLabel = (s: UpcomingSunday) =>
    `${s.city}, ${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(s.startsAt))}`;

  for (const s of sundays) {
    if (s.guests === 0) continue;
    if (s.daysUntil <= 7 && s.locationSent < s.guests) {
      todos.push({
        key: `loc-${s.id}`,
        tone: s.daysUntil <= 3 ? "urgent" : "soon",
        title: `Locatiemail ${dayLabel(s)}`,
        detail: `${s.guests - s.locationSent} van ${s.guests} gasten hebben de locatie nog niet`,
        href: eventHref(s.id, "mails"),
      });
    }
    if (s.daysUntil <= 1 && s.saturdaySent < s.guests) {
      todos.push({
        key: `sat-${s.id}`,
        tone: "urgent",
        title: `Groepsmail en aanraders ${dayLabel(s)}`,
        detail: `Groepsnummer, tafelgenoten en onze aanraders, de dag ervoor`,
        href: eventHref(s.id, "mails"),
      });
    }
    if (s.daysUntil <= 7 && s.questionsOpen > 0) {
      todos.push({
        key: `q-${s.id}`,
        tone: "info",
        title: `Vragen open ${dayLabel(s)}`,
        detail: `${s.questionsOpen} van ${s.guests} gasten hebben de vragen nog niet ingevuld`,
        href: eventHref(s.id, "gasten"),
      });
    }
    if (s.seatsSold >= s.capacity && s.daysUntil > 3) {
      todos.push({
        key: `full-${s.id}`,
        tone: "info",
        title: `Uitverkocht: ${dayLabel(s)}`,
        detail: "Extra plekken of een tweede tafel? De ads voor deze zondag kunnen ook uit.",
        href: eventHref(s.id, "instellingen"),
      });
    }
  }
  for (const s of sundays) {
    if (s.notifyWaiting > 0) {
      todos.push({
        key: `notify-${s.id}`,
        tone: "soon",
        title: `"Houd me op de hoogte" ${dayLabel(s)}`,
        detail: `${s.notifyWaiting} ${s.notifyWaiting === 1 ? "persoon wacht" : "mensen wachten"} op bericht dat deze zondag open is`,
        href: eventHref(s.id, "gasten"),
      });
    }
  }

  const pending = await db.execute<{ id: string; name: string | null; email: string; city: string; created_at: Date }>(sql`
    select b.id, b.customer_name as name, b.email, e.city, b.created_at
    from bookings b join events e on e.id = b.event_id
    where b.payment_status = 'pending' and b.created_at > now() - interval '3 days' and e.starts_at > now()
      and not exists (select 1 from bookings p where lower(p.email) = lower(b.email) and p.payment_status = 'paid' and p.created_at >= b.created_at)
    order by b.created_at desc limit 5`);
  for (const p of pending) {
    todos.push({
      key: `pending-${p.id}`,
      tone: "soon",
      title: `Niet afgerond: ${p.name?.trim() || p.email}`,
      detail: `Begon een boeking voor ${p.city} maar betaalde niet`,
      href: `mailto:${p.email}`,
    });
  }

  const drafts = await db.execute<{ id: string; city: string; starts_at: Date; seats: number }>(sql`
    select e.id, e.city, e.starts_at, sum(b.seats)::int as seats
    from events e join bookings b on b.event_id = e.id and b.payment_status = 'paid' and b.lifecycle_status = 'active'
    where e.workflow_status <> 'published' and e.starts_at > now() and b.amount_cents > 0
    group by e.id order by e.starts_at`);
  for (const d of drafts) {
    todos.push({
      key: `draft-${d.id}`,
      tone: "urgent",
      title: `Betaalde gast op een concepttafel`,
      detail: `${d.city}: ${d.seats} betaalde ${d.seats === 1 ? "plek" : "plekken"} op een tafel die niet online staat`,
      href: eventHref(d.id, "gasten"),
    });
  }

  const order = { urgent: 0, soon: 1, info: 2 } as const;
  todos.sort((a, b) => order[a.tone] - order[b.tone]);
  // Remember when each item came up; items that went away start over if they return.
  const keys = todos.map((t) => t.key);
  if (keys.length > 0) {
    await db.insert(adminTodos).values(keys.map((key) => ({ key }))).onConflictDoNothing();
  }
  await db.delete(adminTodos).where(keys.length > 0 ? notInArray(adminTodos.key, keys) : undefined);
  const seen = new Map((await db.select().from(adminTodos)).map((r) => [r.key, r]));
  const items: TodoItem[] = todos.map((t) => ({ ...t, since: (seen.get(t.key)?.firstSeenAt ?? now).toISOString() }));
  const isDismissed = (t: TodoItem) => seen.get(t.key)?.dismissedDetail === t.detail;

  const monthKey = today.slice(0, 7);
  const [month] = await db.execute<{ revenue: number; seats: number }>(sql`
    select coalesce(sum(b.amount_cents), 0)::int as revenue, coalesce(sum(b.seats), 0)::int as seats
    from bookings b join events e on e.id = b.event_id
    where b.payment_status = 'paid' and b.lifecycle_status in ('active', 'transferred')
      and to_char(e.starts_at at time zone 'Europe/Amsterdam', 'YYYY-MM') = ${monthKey}`);

  const recent = await db.execute<{ id: string; name: string | null; city: string; starts_at: Date; created_at: Date; seats: number }>(sql`
    select b.id, b.customer_name as name, e.city, e.starts_at, b.created_at, b.seats
    from bookings b join events e on e.id = b.event_id
    where b.payment_status = 'paid' and b.amount_cents > 0
    order by b.created_at desc limit 6`);

  return {
    sundays,
    todos: items.filter((t) => !isDismissed(t)),
    dismissed: items.filter(isDismissed),
    month: {
      label: new Intl.DateTimeFormat("nl-NL", { month: "long", timeZone: "UTC" }).format(new Date(`${monthKey}-15T12:00:00Z`)),
      revenueCents: month?.revenue ?? 0,
      seats: month?.seats ?? 0,
      targetCents: monthlyTargetCents(monthKey),
    },
    recentBookings: recent.map((r) => ({
      id: r.id,
      name: r.name?.trim() || "Gast",
      city: r.city,
      startsAt: new Date(r.starts_at).toISOString(),
      createdAt: new Date(r.created_at).toISOString(),
      seats: r.seats,
    })),
  };
}
