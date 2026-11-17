import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { loadFeedbackOverview } from "@/lib/admin/feedback-overview";
import { emailKind } from "@/lib/email/email-kind";
import { EMAIL_TRACKING_SINCE } from "@/lib/email/email-tracking";
import { MAIL_CATALOG, catalogMail, mailGoal, type MailGoalId } from "@/lib/email/mail-catalog";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";

/**
 * The numbers behind the Mails page: per kind of mail for the list, and
 * everything the Grafieken tab draws. One pass over email_log; our own test
 * sends and mails to ourselves are left out.
 */

export type InsightPeriod = "7" | "30" | "90" | "alle";
export const INSIGHT_PERIODS: Array<{ id: InsightPeriod; label: string }> = [
  { id: "7", label: "7 dagen" },
  { id: "30", label: "30 dagen" },
  { id: "90", label: "90 dagen" },
  { id: "alle", label: "Alles" },
];

const DAY = 86_400_000;
/** A paid booking counts for a mail when it comes within this many days after it. */
const BOOK_DAYS = 7;
/** Fewer recipients than this says too little to compare mails on. */
export const MIN_RECIPIENTS = 20;
const PROBLEMS = new Set(["bounced", "suppressed", "complained"]);
const UNDELIVERED = new Set(["bounced", "suppressed"]);
const trackingStart = new Date(EMAIL_TRACKING_SINCE).getTime();

/** Mails meant to bring someone to book; a booking is credited to one of these. */
const BOOKING_MAILS = new Set([
  "Uitnodiging",
  "Bekende gezichten",
  "Nog uitnodigingen?",
  "Boeken open",
  "Plek vrij",
  "Betaling afgebroken",
  "Wachtlijst",
  "Welkom",
  "Review",
  "Terugzien",
  "Gezellig",
]);

type LogRow = {
  id: string;
  email: string;
  to: string;
  subject: string;
  from: string | null;
  sentAt: Date;
  lastEvent: string | null;
  opened: boolean;
  clicked: boolean;
  firstOpenedAt: Date | null;
  hasHtml: boolean;
  kind: string;
};

export type Rate = { part: number; total: number };
export type MailSample = { id: string; to: string; subject: string; from: string | null; sentAt: string };

export type KindNumbers = {
  kind: string;
  sent: number;
  opened: Rate;
  clicked: Rate;
  /** Paid bookings credited to this mail over its recipients; null for mails that are not meant to sell a seat. */
  booked: Rate | null;
  revenueCents: number;
  /** The latest sends with the mail itself stored, newest first. */
  samples: MailSample[];
};

const pct = (r: Rate) => (r.total > 0 ? r.part / r.total : null);

const amsterdamDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" });
const amsterdamParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", hourCycle: "h23" });
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** ISO week number of a day (given at noon UTC). */
function isoWeek(day: Date): number {
  const d = new Date(day);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
}

/** Monday of the week (Amsterdam), as YYYY-MM-DD. */
function weekOf(date: Date): string {
  const d = new Date(`${amsterdamDay.format(date)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

async function loadRows(since: Date | null, now: Date): Promise<LogRow[]> {
  const rows = await getDb().execute<{
    id: string;
    email: string;
    to_email: string;
    subject: string;
    from_email: string | null;
    sent_at: Date;
    last_event: string | null;
    open_count: number;
    click_count: number;
    first_opened_at: Date | null;
    has_html: boolean;
    template: string | null;
  }>(sql`
    select id, email_normalized as email, to_email, subject, from_email, sent_at, last_event, open_count, click_count,
      first_opened_at, html is not null as has_html, template
    from email_log
    where sent_at <= ${now.toISOString()}::timestamptz
      and email_normalized not like 'delivered%@resend.dev'
      and email_normalized not like '%@mytable.club'
      and subject not like '[%'
      ${since ? sql`and sent_at >= ${since.toISOString()}::timestamptz` : sql``}
    order by sent_at desc`);
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    to: r.to_email,
    subject: r.subject,
    from: r.from_email,
    sentAt: new Date(r.sent_at),
    lastEvent: r.last_event,
    opened: r.last_event === "opened" || r.last_event === "clicked" || Number(r.open_count) > 0,
    clicked: r.last_event === "clicked" || Number(r.click_count) > 0,
    firstOpenedAt: r.first_opened_at ? new Date(r.first_opened_at) : null,
    hasHtml: Boolean(r.has_html),
    kind: r.template ?? emailKind(r.subject),
  }));
}

type Booking = { email: string; at: Date; cents: number };

async function loadBookings(since: Date | null): Promise<Booking[]> {
  const rows = await getDb().execute<{ email: string; created_at: Date; amount_cents: number }>(sql`
    select lower(trim(email)) as email, created_at, amount_cents from bookings
    where payment_status = 'paid' and amount_cents > 0
      ${since ? sql`and created_at >= ${since.toISOString()}::timestamptz` : sql``}`);
  return rows.map((r) => ({ email: r.email, at: new Date(r.created_at), cents: Number(r.amount_cents) }));
}

/**
 * Each paid booking goes to one mail: the last one the guest clicked in the
 * week before, else the last one they got. So a booking never counts twice.
 */
function creditBookings(rows: LogRow[], bookings: Booking[]): Map<string, Booking[]> {
  const byEmail = new Map<string, LogRow[]>();
  for (const r of rows) {
    if (!BOOKING_MAILS.has(r.kind) || UNDELIVERED.has(r.lastEvent ?? "")) continue;
    byEmail.set(r.email, [...(byEmail.get(r.email) ?? []), r]);
  }
  const credited = new Map<string, Booking[]>();
  for (const b of bookings) {
    const before = (byEmail.get(b.email) ?? []).filter((r) => r.sentAt < b.at && b.at.getTime() - r.sentAt.getTime() <= BOOK_DAYS * DAY);
    // Rows are newest first.
    const mail = before.find((r) => r.clicked) ?? before[0];
    if (mail) credited.set(mail.id, [...(credited.get(mail.id) ?? []), b]);
  }
  return credited;
}

function kindNumbers(rows: LogRow[], credited: Map<string, Booking[]>, samplesFrom: LogRow[]): KindNumbers[] {
  const byKind = new Map<string, LogRow[]>();
  for (const r of rows) byKind.set(r.kind, [...(byKind.get(r.kind) ?? []), r]);
  const samples = new Map<string, MailSample[]>();
  for (const r of samplesFrom) {
    if (!r.hasHtml) continue;
    const list = samples.get(r.kind) ?? [];
    if (list.length < 3 && !list.some((s) => s.to === r.to)) {
      list.push({ id: r.id, to: r.to, subject: r.subject, from: r.from, sentAt: r.sentAt.toISOString() });
      samples.set(r.kind, list);
    }
  }
  const kinds = new Set([...byKind.keys(), ...samples.keys()]);
  return [...kinds].map((kind) => {
    const list = byKind.get(kind) ?? [];
    const tracked = list.filter((r) => r.sentAt.getTime() >= trackingStart && !UNDELIVERED.has(r.lastEvent ?? ""));
    const mine = list.flatMap((r) => credited.get(r.id) ?? []);
    return {
      kind,
      sent: list.length,
      opened: { part: tracked.filter((r) => r.opened).length, total: tracked.length },
      clicked: { part: tracked.filter((r) => r.clicked).length, total: tracked.length },
      booked: BOOKING_MAILS.has(kind) ? { part: mine.length, total: new Set(list.map((r) => r.email)).size } : null,
      revenueCents: mine.reduce((n, b) => n + b.cents, 0),
      samples: samples.get(kind) ?? [],
    };
  });
}

/** Per kind of mail over the last 30 days, with the latest sends to look at. For the list of all mails. */
export async function getMailListNumbers(now = new Date()): Promise<Map<string, KindNumbers>> {
  // Samples may be older than the 30 days the numbers cover.
  const all = await loadRows(new Date(now.getTime() - 120 * DAY), now);
  const since = new Date(now.getTime() - 30 * DAY);
  const rows = all.filter((r) => r.sentAt >= since);
  const bookings = (await loadBookings(since)).filter((b) => b.at <= now);
  const numbers = kindNumbers(rows, creditBookings(all, bookings), all);
  const out = new Map<string, KindNumbers>();
  for (const n of numbers) {
    const key = catalogMail(n.kind)?.kind ?? n.kind;
    const have = out.get(key);
    if (!have) out.set(key, { ...n, kind: key });
    else {
      have.sent += n.sent;
      have.opened = { part: have.opened.part + n.opened.part, total: have.opened.total + n.opened.total };
      have.clicked = { part: have.clicked.part + n.clicked.part, total: have.clicked.total + n.clicked.total };
      have.samples = [...have.samples, ...n.samples].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 3);
    }
  }
  return out;
}

export type ChartGoal = MailGoalId;
export type MailInsights = {
  period: InsightPeriod;
  kpis: {
    sent: number;
    sentBefore: number | null;
    delivered: Rate;
    opened: Rate;
    openedBefore: Rate | null;
    clicked: Rate;
    clickedBefore: Rate | null;
    bookings: number;
    revenueCents: number;
    /** All paid booking revenue in the period, to set the mail revenue against. */
    allRevenueCents: number;
  };
  /** From sent to booked, over the mails meant to sell a seat only. */
  funnel: Array<{ label: string; value: number; before: number | null }>;
  /** Mails per full week (per day for 7 days), split by goal; the week or day still running comes last, marked. */
  volume: Array<{ key: string; label: string; sub: string; running: boolean; total: number; byGoal: Partial<Record<ChartGoal, number>> }>;
  volumePerDay: boolean;
  /** Mails meant to sell a seat, with enough recipients to compare, best first. */
  selling: Array<{ kind: string; booked: Rate; revenueCents: number; before: Rate | null }>;
  cities: Array<{ city: string; sent: number; clicked: number; booked: number; before: { sent: number; booked: number } | null }>;
  /** "Kom je zondag?" per Sunday: said yes, moved their seat, or silent. */
  confirms: Array<{ eventId: string; city: string; startsAt: string; yes: number; moved: number; silent: number }>;
  /** Share of guests that takes each step around a Sunday. */
  steps: Array<{ label: string; rate: Rate; before: Rate | null }>;
  /** Opens per weekday (Monday first) and part of the day. */
  heat: { slots: string[]; days: number[][]; peak: { day: number; slot: number } | null };
  senders: Array<{ from: string; problems: Rate; before: Rate | null }>;
  providers: Array<{ name: string; problems: Rate; before: Rate | null }>;
  /** What guests did with their invite settings: unsubscribed, or changed a city. */
  prefs: {
    /** People who turned every city off, over the people who got an invite in the period. */
    unsubscribed: Rate;
    before: Rate | null;
    /** Through the settings page, or the unsubscribe button of their mail app. */
    viaPage: number;
    viaMailApp: number;
    /** Unsubscribes per column of the volume grid. */
    perColumn: number[];
    /** Per city: turned off, set to less often, or turned (back) on. */
    cities: Array<{ city: string; off: number; less: number; on: number }>;
  };
  /** Mails per day for a week from today: sent and still planned. */
  limit: Array<{ day: string; sent: number; planned: number }>;
};

const HEAT_SLOTS = ["0-6", "6-9", "9-12", "12-15", "15-18", "18-21", "21-24"];
const slotOf = (hour: number) => (hour < 6 ? 0 : Math.min(6, Math.floor((hour - 6) / 3) + 1));

function provider(email: string): string {
  const domain = email.split("@")[1] ?? "";
  if (/^(gmail|googlemail)\./.test(domain)) return "Gmail";
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return "Outlook en Hotmail";
  if (/^(icloud|me|mac)\./.test(domain)) return "iCloud";
  return "Overig";
}

const senderAddress = (from: string | null) => from?.match(/<([^>]+)>/)?.[1]?.trim() ?? from?.trim() ?? "-";

function rates(rows: LogRow[]) {
  const delivered = rows.filter((r) => !UNDELIVERED.has(r.lastEvent ?? ""));
  const tracked = delivered.filter((r) => r.sentAt.getTime() >= trackingStart);
  return {
    sent: rows.length,
    delivered: { part: delivered.length, total: rows.length },
    opened: { part: tracked.filter((r) => r.opened).length, total: tracked.length },
    clicked: { part: tracked.filter((r) => r.clicked).length, total: tracked.length },
  };
}

/** Mails per Amsterdam day for a week from today: sent, and still planned (at Resend or in the invite queue). */
export async function getDayVolume(now = new Date()): Promise<Array<{ day: string; sent: number; planned: number }>> {
  const db = getDb();
  const today = amsterdamDay.format(now);
  const lastDay = amsterdamDay.format(new Date(now.getTime() + 6 * DAY));
  const limitRows = await db.execute<{ day: string; sent: number; planned: number }>(sql`
    select day, sum(sent)::int as sent, sum(planned)::int as planned from (
      select to_char(sent_at at time zone 'Europe/Amsterdam', 'YYYY-MM-DD') as day,
        count(*) filter (where sent_at <= ${now.toISOString()}::timestamptz) as sent,
        count(*) filter (where sent_at > ${now.toISOString()}::timestamptz) as planned
      from email_log
      where (sent_at at time zone 'Europe/Amsterdam')::date between ${today}::date and ${lastDay}::date
      group by 1
      union all
      select to_char(scheduled_for at time zone 'Europe/Amsterdam', 'YYYY-MM-DD'), 0, count(*)
      from invite_sends
      where status in ('queued', 'approved') and (scheduled_for at time zone 'Europe/Amsterdam')::date between ${today}::date and ${lastDay}::date
      group by 1
    ) t group by day`);
  const limitBy = new Map(limitRows.map((r) => [r.day, r]));
  return Array.from({ length: 7 }, (_, i) => {
    const day = amsterdamDay.format(new Date(now.getTime() + i * DAY));
    return { day, sent: Number(limitBy.get(day)?.sent ?? 0), planned: Number(limitBy.get(day)?.planned ?? 0) };
  });
}

export async function getMailInsights(period: InsightPeriod, now = new Date()): Promise<MailInsights> {
  const db = getDb();
  const days = period === "alle" ? null : Number(period);
  const since = days ? new Date(now.getTime() - days * DAY) : null;
  const before = days ? new Date(now.getTime() - 2 * days * DAY) : null;

  // One query after the other: the pool has 3 connections.
  const all = await loadRows(before, now);
  const rows = since ? all.filter((r) => r.sentAt >= since) : all;
  const previous = since ? all.filter((r) => r.sentAt < since) : null;
  const allBookings = (await loadBookings(before)).filter((b) => b.at <= now);
  const bookings = since ? allBookings.filter((b) => b.at >= since) : allBookings;
  const credited = creditBookings(all, allBookings);
  const numbers = kindNumbers(rows, credited, []);
  // The same numbers over the period before, to set this one against.
  const numbersBefore = previous ? kindNumbers(previous, credited, []) : null;

  const cur = rates(rows);
  const prev = previous ? rates(previous) : null;
  const creditedNow = rows.flatMap((r) => credited.get(r.id) ?? []);
  // Only mails meant to sell a seat can end in a booking: the funnel counts those, not every mail.
  const sell = rates(rows.filter((r) => BOOKING_MAILS.has(r.kind)));
  const sellBefore = previous ? rates(previous.filter((r) => BOOKING_MAILS.has(r.kind))) : null;
  const creditedBefore = previous ? previous.flatMap((r) => credited.get(r.id) ?? []) : null;

  // Volume: per day for a week, else per week (the last 8). Only whole weeks or days, plus the one still running.
  const perDay = period === "7";
  const buckets = new Map<string, { total: number; byGoal: Partial<Record<ChartGoal, number>> }>();
  for (const r of rows) {
    const key = perDay ? amsterdamDay.format(r.sentAt) : weekOf(r.sentAt);
    const goal = mailGoal(r.kind);
    const b = buckets.get(key) ?? { total: 0, byGoal: {} };
    b.total++;
    b.byGoal[goal] = (b.byGoal[goal] ?? 0) + 1;
    buckets.set(key, b);
  }
  const runningKey = perDay ? amsterdamDay.format(now) : weekOf(now);
  // A week or day without mails is still a column: "the week before" must be the week before.
  const firstKey = [...buckets.keys()].sort()[0];
  for (let at = firstKey ? Date.parse(`${firstKey}T12:00:00Z`) : NaN; at <= Date.parse(`${runningKey}T12:00:00Z`); at += (perDay ? 1 : 7) * DAY) {
    const key = new Date(at).toISOString().slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, { total: 0, byGoal: {} });
  }
  // The period starts in the middle of a week or day: that first piece is not a whole one.
  const cutKey = since ? (perDay ? amsterdamDay.format(since) : weekOf(since)) : null;
  const short = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" });
  const weekday = new Intl.DateTimeFormat("nl-NL", { weekday: "short", timeZone: "UTC" });
  const volume = [...buckets.entries()]
    .filter(([key]) => key !== cutKey || key === runningKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, b]) => {
      const at = new Date(`${key}T12:00:00Z`);
      const date = short.format(at).replace(".", "");
      return { label: perDay ? weekday.format(at).replace(".", "") : `wk ${isoWeek(at)}`, sub: date, running: key === runningKey, key, ...b };
    });

  const selling = numbers
    .filter((n) => n.booked && n.booked.total >= MIN_RECIPIENTS)
    .map((n) => {
      const was = numbersBefore?.find((b) => b.kind === n.kind)?.booked ?? null;
      return { kind: n.kind, booked: n.booked!, revenueCents: n.revenueCents, before: was && was.total >= MIN_RECIPIENTS ? was : null };
    })
    .sort((a, b) => (pct(b.booked) ?? 0) - (pct(a.booked) ?? 0));

  const citiesIn = (from: Date | null, to: Date) =>
    db.execute<{ city: string; sent: number; clicked: number; booked: number }>(sql`
    select s.cities[1] as city, count(*)::int as sent,
      count(*) filter (where exists (select 1 from invite_clicks c where c.send_id = s.id))::int as clicked,
      count(*) filter (where exists (
        select 1 from bookings b join events e on e.id = b.event_id
        where lower(trim(b.email)) = s.email_normalized and b.payment_status = 'paid' and e.city = s.cities[1]
          and b.created_at > s.sent_at and b.created_at <= s.sent_at + make_interval(days => ${BOOK_DAYS})))::int as booked
    from invite_sends s
    where s.status = 'sent' and s.kind in ('invite', 'nudge', 'match') and array_length(s.cities, 1) >= 1
      and s.sent_at <= ${to.toISOString()}::timestamptz
      ${from ? sql`and s.sent_at >= ${from.toISOString()}::timestamptz` : sql``}
    group by 1 order by 2 desc`);
  const cityRows = await citiesIn(since, now);
  const cityRowsBefore = since ? await citiesIn(before, since) : null;

  const confirmRows = await db.execute<{ id: string; city: string; starts_at: Date; yes: number; moved: number; silent: number }>(sql`
    select e.id, e.city, e.starts_at,
      count(*) filter (where b.lifecycle_status = 'active' and b.attendance_confirmed_at is not null)::int as yes,
      count(*) filter (where b.lifecycle_status = 'transferred' and b.transferred_at > e.starts_at - interval '10 days')::int as moved,
      count(*) filter (where b.lifecycle_status = 'active' and b.attendance_confirmed_at is null and b.cancelled_late_at is null)::int as silent
    from events e join bookings b on b.event_id = e.id
    where e.workflow_status = 'published' and e.experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      and b.payment_status = 'paid' and b.membership_id is null
      and e.starts_at - interval '9 days' <= ${now.toISOString()}::timestamptz
      and e.starts_at >= ${(since ?? new Date(0)).toISOString()}::timestamptz
    group by e.id having count(*) filter (where b.attendance_confirmed_at is not null) > 0
    order by e.starts_at desc limit 8`);

  const feedbackPeriod = period === "alle" ? "all" : period === "90" ? "90" : "30";
  const stepsOf = (list: KindNumbers[], f: Awaited<ReturnType<typeof loadFeedbackOverview>>["total"]) => {
    const of = (kind: string) => list.find((n) => n.kind === kind);
    const none = { part: 0, total: 0 };
    return [
      { label: 'Opent "Kom je zondag?"', rate: of("Kom je zondag?")?.opened ?? none },
      { label: "Opent de locatiemail", rate: of("Locatie")?.opened ?? none },
      { label: "Klikt door naar de tafelpagina", rate: of("Groep")?.clicked ?? none },
      { label: "Komt", rate: { part: f.guests, total: f.guests + f.noShows + f.lateCancels } },
      { label: "Geeft feedback", rate: { part: f.answered, total: f.mailed } },
      { label: "Kiest iemand om terug te zien", rate: { part: f.picked, total: f.guests } },
      { label: "Boekt opnieuw binnen 60 dagen", rate: { part: f.rebooked, total: f.rebookBase } },
    ];
  };
  const stepsNow = stepsOf(numbers, (await loadFeedbackOverview(feedbackPeriod, null, now)).total);
  // The period before: the same window, ending where this one starts.
  const stepsBefore = since && numbersBefore ? stepsOf(numbersBefore, (await loadFeedbackOverview(feedbackPeriod, null, since)).total) : null;
  const steps: MailInsights["steps"] = stepsNow
    .map((step, i) => ({ ...step, before: stepsBefore && stepsBefore[i]!.rate.total > 0 ? stepsBefore[i]!.rate : null }))
    .filter((step) => step.rate.total > 0);

  const heatDays = WEEKDAYS.map(() => HEAT_SLOTS.map(() => 0));
  for (const r of rows) {
    if (!r.firstOpenedAt) continue;
    const parts = amsterdamParts.formatToParts(r.firstOpenedAt);
    const day = WEEKDAYS.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    if (day >= 0) heatDays[day]![slotOf(hour)]!++;
  }
  let peak: MailInsights["heat"]["peak"] = null;
  heatDays.forEach((slots, day) =>
    slots.forEach((n, slot) => {
      if (n > 0 && (!peak || n > heatDays[peak.day]![peak.slot]!)) peak = { day, slot };
    }),
  );

  const tallyOf = (list: LogRow[], key: (r: LogRow) => string) => {
    const m = new Map<string, Rate>();
    for (const r of list) {
      const k = key(r);
      const have = m.get(k) ?? { part: 0, total: 0 };
      have.total++;
      if (PROBLEMS.has(r.lastEvent ?? "")) have.part++;
      m.set(k, have);
    }
    return m;
  };
  const tally = (key: (r: LogRow) => string) => {
    const was = previous ? tallyOf(previous, key) : null;
    return [...tallyOf(rows, key).entries()].sort((a, b) => b[1].total - a[1].total).map(([name, problems]) => ({ name, problems, before: was?.get(name) ?? null }));
  };

  const limit = await getDayVolume(now);

  // Changes of invite settings. Empty until drizzle/0071 is applied.
  type PrefRow = { email: string; changed_at: Date; source: string; changes: Array<{ city: string; from: string; to: string }>; unsubscribed: boolean };
  const prefRows = ((await db
    .execute<PrefRow>(sql`
      select email_normalized as email, changed_at, source, changes, unsubscribed from invite_pref_changes
      where changed_at <= ${now.toISOString()}::timestamptz
        ${before ? sql`and changed_at >= ${before.toISOString()}::timestamptz` : sql``}`)
    .catch(() => [])) as unknown as PrefRow[]).map((r) => ({ ...r, changed_at: new Date(r.changed_at) }));
  const prefNow = since ? prefRows.filter((r) => r.changed_at >= since) : prefRows;
  const prefBefore = since ? prefRows.filter((r) => r.changed_at < since) : null;
  const [invited] = await db.execute<{ now: number; before: number }>(sql`
    select count(distinct email_normalized) filter (where ${since ? sql`sent_at >= ${since.toISOString()}::timestamptz` : sql`true`})::int as now,
      count(distinct email_normalized) filter (where ${since ? sql`sent_at < ${since.toISOString()}::timestamptz` : sql`false`})::int as before
    from invite_sends
    where status = 'sent' and sent_at <= ${now.toISOString()}::timestamptz
      ${before ? sql`and sent_at >= ${before.toISOString()}::timestamptz` : sql``}`);
  const unsubscribers = (list: typeof prefRows) => new Set(list.filter((r) => r.unsubscribed).map((r) => r.email)).size;
  const cityMoves = new Map<string, { off: number; less: number; on: number }>();
  for (const row of prefNow) {
    for (const c of row.changes ?? []) {
      const have = cityMoves.get(c.city) ?? { off: 0, less: 0, on: 0 };
      if (c.to === "none") have.off++;
      else if (c.to === "less") have.less++;
      else have.on++;
      cityMoves.set(c.city, have);
    }
  }

  return {
    period,
    kpis: {
      sent: cur.sent,
      sentBefore: prev ? prev.sent : null,
      delivered: cur.delivered,
      opened: cur.opened,
      openedBefore: prev ? prev.opened : null,
      clicked: cur.clicked,
      clickedBefore: prev ? prev.clicked : null,
      bookings: creditedNow.length,
      revenueCents: creditedNow.reduce((n, b) => n + b.cents, 0),
      allRevenueCents: bookings.reduce((n, b) => n + b.cents, 0),
    },
    funnel: [
      { label: "Verstuurd", value: sell.sent, before: sellBefore?.sent ?? null },
      { label: "Afgeleverd", value: sell.delivered.part, before: sellBefore?.delivered.part ?? null },
      { label: "Geopend", value: sell.opened.part, before: sellBefore?.opened.part ?? null },
      { label: "Geklikt", value: sell.clicked.part, before: sellBefore?.clicked.part ?? null },
      { label: "Geboekt", value: creditedNow.length, before: creditedBefore?.length ?? null },
    ],
    volume,
    volumePerDay: perDay,
    selling,
    cities: cityRows.map((r) => {
      const was = cityRowsBefore?.find((b) => b.city === r.city);
      return { city: r.city, sent: Number(r.sent), clicked: Number(r.clicked), booked: Number(r.booked), before: was ? { sent: Number(was.sent), booked: Number(was.booked) } : null };
    }),
    confirms: confirmRows.map((r) => ({
      eventId: r.id,
      city: r.city,
      startsAt: new Date(r.starts_at).toISOString(),
      yes: Number(r.yes),
      moved: Number(r.moved),
      silent: Number(r.silent),
    })),
    steps,
    heat: { slots: HEAT_SLOTS, days: heatDays, peak },
    senders: tally((r) => senderAddress(r.from)).map(({ name, ...rest }) => ({ from: name, ...rest })),
    providers: tally((r) => provider(r.email)),
    prefs: {
      unsubscribed: { part: unsubscribers(prefNow), total: Number(invited?.now ?? 0) },
      before: prefBefore ? { part: unsubscribers(prefBefore), total: Number(invited?.before ?? 0) } : null,
      viaPage: prefNow.filter((r) => r.unsubscribed && r.source === "page").length,
      viaMailApp: prefNow.filter((r) => r.unsubscribed && r.source === "one_click").length,
      perColumn: volume.map((v) => prefNow.filter((r) => r.unsubscribed && (perDay ? amsterdamDay.format(r.changed_at) : weekOf(r.changed_at)) === v.key).length),
      cities: [...cityMoves.entries()].map(([city, n]) => ({ city, ...n })).sort((a, b) => b.off + b.less + b.on - (a.off + a.less + a.on)),
    },
    limit,
  };
}

/** The goals a chart colours, in a fixed order, so a goal keeps its colour. */
export const CHART_GOALS: ChartGoal[] = ["groei", "vooraf", "boeken", "achteraf", "lid", "overig"];

/** Catalog order for the list of all mails. */
export const CATALOG_KINDS = MAIL_CATALOG.map((m) => m.kind);
