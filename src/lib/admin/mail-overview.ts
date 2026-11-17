import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  defaultScheduleAt,
  loadSundayMailContext,
  mailRecipients,
  type SundayMailContext,
  type SundayMailKind,
} from "@/lib/admin/sunday-mails";
import { emailKind } from "@/lib/email/email-kind";
import { catalogMail } from "@/lib/email/mail-catalog";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";

/** What goes out around one Sunday and when: sent, planned or still to come.
 * Also the list of mails coming up across all Sundays, for the Mails page. */

const DAY_MS = 86_400_000;

type Guest = SundayMailContext["guests"][number];

const STEPS: Array<{ kind: SundayMailKind; label: string; auto: boolean; sent: (g: Guest) => boolean }> = [
  { kind: "confirm", label: "Kom je zondag?", auto: true, sent: (g) => g.sentConfirm },
  { kind: "confirmAgain", label: "Kom je zondag, herinnering", auto: true, sent: (g) => g.sentConfirmAgain },
  { kind: "location", label: "Locatie", auto: false, sent: (g) => g.sentLocation },
  { kind: "saturday", label: "Groep", auto: false, sent: (g) => g.sentSaturday },
  { kind: "morning", label: "Vanmiddag", auto: false, sent: (g) => g.sentMorning },
  { kind: "feedback", label: "Review", auto: true, sent: (g) => g.sentFeedback },
  { kind: "reminder", label: "Terugzien", auto: true, sent: (g) => g.sentReminder },
  { kind: "liked", label: "Gezellig", auto: true, sent: (g) => g.sentLiked },
];

/** The name emailKind() gives a sent mail, to the Sunday step it is. */
const STEP_OF_LABEL: Record<string, SundayMailKind> = {
  "Kom je zondag?": "confirm",
  "Kom je zondag, herinnering": "confirmAgain",
  Locatie: "location",
  Groep: "saturday",
  Vanmiddag: "morning",
  Aanraders: "morning",
  Review: "feedback",
  Terugzien: "reminder",
  Gezellig: "liked",
};

export type TimelineState = "sent" | "partial" | "planned" | "coming" | "late" | "off" | "none";

export type TimelineStep = {
  kind: SundayMailKind;
  title: string;
  /** When it goes by itself, or should go by hand. */
  at: Date;
  /** Only the day is set (the location mail). */
  dayOnly: boolean;
  auto: boolean;
  /** Guests it is for; null while that can't be known yet. */
  total: number | null;
  sent: number;
  /** The first time it went out for this Sunday. */
  sentAt: Date | null;
  planned: { at: Date; count: number } | null;
  state: TimelineState;
};

/** When each step is due for a Sunday. The location mail has no clock time: a week before. */
export function stepDueAt(ctx: Pick<SundayMailContext, "startsAt" | "autoMailShiftDays">, kind: SundayMailKind): Date {
  if (kind === "location") return new Date(ctx.startsAt.getTime() - 7 * DAY_MS);
  const shift = kind === "reminder" || kind === "liked" ? ctx.autoMailShiftDays : 0;
  return new Date(defaultScheduleAt(ctx.startsAt, kind).getTime() + shift * DAY_MS);
}

export function sundayTimeline(ctx: SundayMailContext, sentAt: Partial<Record<SundayMailKind, Date>>, now = new Date()): TimelineStep[] {
  const confirmAt = stepDueAt(ctx, "confirm");
  return STEPS.map((step) => {
    const at = stepDueAt(ctx, step.kind);
    const plan = step.kind === "saturday" || step.kind === "morning" || step.kind === "feedback" ? ctx.schedule[step.kind] : undefined;
    const planned = plan && Date.parse(plan.at) > now.getTime() ? { at: new Date(plan.at), count: plan.ids.length } : null;
    const flagged = ctx.guests.filter(step.sent);
    // A planned mail is already in the log, at its send time.
    const sent = Math.max(0, flagged.length - (planned?.count ?? 0));
    const audience = step.kind === "confirm" ? ctx.guests.filter((g) => !g.member) : mailRecipients(ctx, step.kind);
    const everyone = new Set([...audience, ...flagged].map((g) => g.bookingId)).size;
    const unknown =
      sent === 0 &&
      (((step.kind === "reminder" || step.kind === "liked") && now < ctx.startsAt) || (step.kind === "confirmAgain" && now < confirmAt));
    const total = unknown ? null : everyone;
    const off = step.auto && ctx.autoMailsOff.includes(step.kind);
    const dayOnly = step.kind === "location";
    const state: TimelineState = planned
      ? "planned"
      : total !== null && total > 0 && sent >= total
        ? "sent"
        : sent > 0
          ? "partial"
          : off
            ? "off"
            : now.getTime() < at.getTime() + (dayOnly ? DAY_MS / 2 : 0)
              ? "coming"
              : total === 0
                ? "none"
                : "late";
    return {
      kind: step.kind,
      title: catalogMail(step.label)?.title ?? step.label,
      at,
      dayOnly,
      auto: step.auto,
      total,
      sent,
      sentAt: sentAt[step.kind] ?? null,
      planned,
      state,
    };
  }).sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The first time each step went out to this Sunday's guests, from the log. */
async function firstSentPerStep(ctx: SundayMailContext, now: Date): Promise<Partial<Record<SundayMailKind, Date>>> {
  const emails = [...new Set(ctx.guests.map((g) => g.email.trim().toLowerCase()))];
  if (emails.length === 0) return {};
  const from = new Date(ctx.startsAt.getTime() - 10 * DAY_MS);
  const to = new Date(Math.min(now.getTime(), ctx.startsAt.getTime() + (8 + ctx.autoMailShiftDays) * DAY_MS));
  const rows = await getDb().execute<{ subject: string; first: Date }>(sql`
    select subject, min(sent_at) as first from email_log
    where email_normalized in (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})
      and sent_at between ${from.toISOString()}::timestamptz and ${to.toISOString()}::timestamptz
      and subject not like '[%'
    group by subject`);
  const out: Partial<Record<SundayMailKind, Date>> = {};
  for (const row of rows) {
    const kind = STEP_OF_LABEL[emailKind(row.subject)];
    if (!kind) continue;
    const first = new Date(row.first);
    if (!out[kind] || first < out[kind]!) out[kind] = first;
  }
  return out;
}

export async function loadSundayTimeline(eventId: string, now = new Date()): Promise<{ ctx: SundayMailContext; steps: TimelineStep[] } | null> {
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx) return null;
  return { ctx, steps: sundayTimeline(ctx, await firstSentPerStep(ctx, now), now) };
}

export type UpcomingMail = {
  at: Date;
  dayOnly: boolean;
  title: string;
  /** "Utrecht · zo 22 nov", or null for mails that are not about one Sunday. */
  sunday: { eventId: string; city: string; startsAt: Date } | null;
  count: number | null;
  how: "Automatisch" | "Ingepland" | "Met de hand" | "Wacht op akkoord";
  managePath: string | null;
};

const INVITE_TITLES: Record<string, string> = {
  invite: "Uitnodiging",
  nudge: "Uitnodiging, tweede",
  checkin: "Wil je nog uitnodigingen?",
  match: "Bekende gezichten",
};

/**
 * What goes out in the coming `days`: the steps of every Sunday in reach,
 * the invites in the queue, and other mails waiting at Resend for their time.
 * One Sunday after the other on purpose: the pool has 3 connections.
 */
export async function getUpcomingMails(now = new Date(), days = 14): Promise<UpcomingMail[]> {
  const db = getDb();
  const until = new Date(now.getTime() + days * DAY_MS);
  const out: UpcomingMail[] = [];

  // A Sunday's first step is 9 days before it and its last 3 (plus a shift) after.
  const events = await db.execute<{ id: string }>(sql`
    select id from events
    where workflow_status = 'published'
      and experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      and starts_at between ${new Date(now.getTime() - 6 * DAY_MS).toISOString()}::timestamptz
        and ${new Date(until.getTime() + 9 * DAY_MS).toISOString()}::timestamptz
    order by starts_at`);
  for (const { id } of events) {
    const ctx = await loadSundayMailContext(id);
    if (!ctx || ctx.guests.length === 0) continue;
    for (const step of sundayTimeline(ctx, {}, now)) {
      if (step.state !== "coming" && step.state !== "planned") continue;
      if (step.total === 0) continue;
      const at = step.planned?.at ?? step.at;
      if (at > until) continue;
      out.push({
        at,
        dayOnly: step.dayOnly,
        title: step.title,
        sunday: { eventId: id, city: ctx.city, startsAt: ctx.startsAt },
        count: step.planned ? step.planned.count : step.total === null ? null : step.total - step.sent,
        how: step.planned ? "Ingepland" : step.auto ? "Automatisch" : "Met de hand",
        managePath: `/events/${id}/guests?tab=mails`,
      });
    }
  }

  const invites = await db.execute<{ kind: string; status: string; first: Date; n: number }>(sql`
    select kind, status, min(scheduled_for) as first, count(*)::int as n from invite_sends
    where status in ('queued', 'approved')
      and scheduled_for > ${now.toISOString()}::timestamptz and scheduled_for <= ${until.toISOString()}::timestamptz
    group by kind, status, (scheduled_for at time zone 'Europe/Amsterdam')::date`);
  for (const row of invites) {
    out.push({
      at: new Date(row.first),
      dayOnly: true,
      title: INVITE_TITLES[row.kind] ?? "Uitnodiging",
      sunday: null,
      count: Number(row.n),
      how: row.status === "approved" ? "Ingepland" : "Wacht op akkoord",
      managePath: "/invites",
    });
  }

  // Waiting at Resend with a send time (the mail after a missed Sunday). The
  // planned Sunday steps are in the log too, and already listed above.
  const waiting = await db.execute<{ subject: string; sent_at: Date }>(sql`
    select subject, sent_at from email_log
    where sent_at > ${now.toISOString()}::timestamptz and sent_at <= ${until.toISOString()}::timestamptz`);
  const grouped = new Map<string, UpcomingMail>();
  for (const row of waiting) {
    const kind = emailKind(row.subject);
    if (STEP_OF_LABEL[kind]) continue;
    const at = new Date(row.sent_at);
    const key = `${kind}|${Math.floor(at.getTime() / 60_000)}`;
    const item = grouped.get(key);
    if (item) item.count = (item.count ?? 0) + 1;
    else grouped.set(key, { at, dayOnly: false, title: catalogMail(kind)?.title ?? kind, sunday: null, count: 1, how: "Ingepland", managePath: null });
  }
  out.push(...grouped.values());

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export type KindActivity = { last: Date; last30: number };

/** Per kind of mail: when it last went out and how often in the last 30 days. Not our own test sends. */
export async function getMailKindActivity(now = new Date()): Promise<Map<string, KindActivity>> {
  const rows = await getDb().execute<{ subject: string; last: Date; last30: number }>(sql`
    select subject, max(sent_at) as last,
      count(*) filter (where sent_at > ${new Date(now.getTime() - 30 * DAY_MS).toISOString()}::timestamptz)::int as last30
    from email_log
    where sent_at <= ${now.toISOString()}::timestamptz
      and email_normalized not like 'delivered+%'
      and subject !~* '^\\[(test|voorbeeld|preview|kopie)'
    group by subject`);
  const out = new Map<string, KindActivity>();
  for (const row of rows) {
    const mail = catalogMail(emailKind(row.subject));
    if (!mail) continue;
    const last = new Date(row.last);
    const item = out.get(mail.kind);
    if (item) {
      item.last30 += Number(row.last30);
      if (last > item.last) item.last = last;
    } else out.set(mail.kind, { last, last30: Number(row.last30) });
  }
  return out;
}
