import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { emailKind } from "@/lib/email/email-kind";
import { EMAIL_TRACKING_SINCE } from "@/lib/email/email-tracking";

/** How each kind of automatic mail performs over a period. */

export type EmailPeriod = "7" | "30" | "90" | "alle";
export const EMAIL_PERIODS: Array<{ id: EmailPeriod; label: string }> = [
  { id: "7", label: "7 dagen" },
  { id: "30", label: "30 dagen" },
  { id: "90", label: "90 dagen" },
  { id: "alle", label: "Alles" },
];

/** A booking counts for a mail when it is paid within this many days after it. */
const BOOKED_WITHIN_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;
const PROBLEMS = new Set(["bounced", "suppressed"]);
const OPENED = new Set(["opened", "clicked"]);

export type Rate = { part: number; total: number };
export type KindStats = {
  kind: string;
  sent: number;
  /** null: nothing sent in this period since tracking started. */
  opened: Rate | null;
  clicked: Rate | null;
  spam: Rate;
  bounce: Rate;
  booked: Rate;
  revenueCents: number;
  previous: { opened: Rate | null; clicked: Rate | null; booked: Rate };
};
export type WeekPoint = { week: string; sent: number; opened: Rate | null; clicked: Rate | null; booked: Rate };
export type EmailStats = { period: EmailPeriod; since: string | null; kinds: KindStats[]; weeks: WeekPoint[] | null };

type MailRow = {
  email: string;
  subject: string;
  sent_at: Date;
  last_event: string | null;
  open_count: number;
  click_count: number;
};
type BookingRow = { email: string; created_at: Date; amount_cents: number };

const trackingStart = new Date(EMAIL_TRACKING_SINCE).getTime();

function rate(part: number, total: number): Rate {
  return { part, total };
}

/** Monday of the week (Amsterdam), as YYYY-MM-DD. */
function weekOf(date: Date): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(date);
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function summarize(rows: MailRow[], bookingsByEmail: Map<string, BookingRow[]>) {
  const delivered = rows.filter((r) => !PROBLEMS.has(r.last_event ?? ""));
  const tracked = delivered.filter((r) => r.sent_at.getTime() >= trackingStart);
  const opened = tracked.filter((r) => OPENED.has(r.last_event ?? "") || r.open_count > 0).length;
  const clicked = tracked.filter((r) => r.last_event === "clicked" || r.click_count > 0).length;

  // One booking per recipient: the first paid one within the window after
  // their first mail of this kind in the period.
  const firstMail = new Map<string, number>();
  for (const r of rows) {
    const t = r.sent_at.getTime();
    const seen = firstMail.get(r.email);
    if (seen === undefined || t < seen) firstMail.set(r.email, t);
  }
  let booked = 0;
  let revenueCents = 0;
  for (const [email, t] of firstMail) {
    const hit = (bookingsByEmail.get(email) ?? []).find((b) => {
      const bt = b.created_at.getTime();
      return bt > t && bt <= t + BOOKED_WITHIN_DAYS * DAY;
    });
    if (hit) {
      booked += 1;
      revenueCents += hit.amount_cents;
    }
  }
  return {
    sent: rows.length,
    opened: tracked.length > 0 ? rate(opened, tracked.length) : null,
    clicked: tracked.length > 0 ? rate(clicked, tracked.length) : null,
    spam: rate(rows.filter((r) => r.last_event === "complained").length, rows.length),
    bounce: rate(rows.filter((r) => PROBLEMS.has(r.last_event ?? "")).length, rows.length),
    booked: rate(booked, firstMail.size),
    revenueCents,
  };
}

export async function getEmailStats(period: EmailPeriod, detailKind: string | null): Promise<EmailStats> {
  const db = getDb();
  const now = Date.now();
  const days = period === "alle" ? null : Number(period);
  const since = days ? new Date(now - days * DAY) : null;
  const prevSince = days ? new Date(now - 2 * days * DAY) : null;

  const mails = (await db.execute(sql`
    select email_normalized as email, subject, sent_at, last_event, open_count, click_count
    from email_log
    -- Not Resend test addresses, our own inbox, or "[TEST]" / "[Voorbeeld]" sends.
    where email_normalized not like 'delivered+%'
      and email_normalized not like '%@mytable.club'
      and subject not like '[%'
      ${prevSince ? sql`and sent_at >= ${prevSince.toISOString()}::timestamptz` : sql``}
  `)) as unknown as MailRow[];
  const bookings = (await db.execute(sql`
    select lower(email) as email, created_at, amount_cents from bookings
    where payment_status = 'paid' and amount_cents > 0
    order by created_at
  `)) as unknown as BookingRow[];
  const bookingsByEmail = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const at = new Date(b.created_at);
    const list = bookingsByEmail.get(b.email) ?? [];
    list.push({ ...b, created_at: at });
    bookingsByEmail.set(b.email, list);
  }

  const byKind = new Map<string, { cur: MailRow[]; prev: MailRow[] }>();
  for (const m of mails) {
    const row = { ...m, sent_at: new Date(m.sent_at), open_count: Number(m.open_count), click_count: Number(m.click_count) };
    const kind = emailKind(row.subject);
    const bucket = byKind.get(kind) ?? { cur: [], prev: [] };
    if (!since || row.sent_at >= since) bucket.cur.push(row);
    else bucket.prev.push(row);
    byKind.set(kind, bucket);
  }

  const kinds: KindStats[] = [...byKind.entries()]
    .filter(([, b]) => b.cur.length > 0)
    .map(([kind, b]) => {
      const cur = summarize(b.cur, bookingsByEmail);
      const prev = summarize(b.prev, bookingsByEmail);
      return { kind, ...cur, previous: { opened: prev.opened, clicked: prev.clicked, booked: prev.booked } };
    })
    .sort((a, b) => b.sent - a.sent);

  let weeks: WeekPoint[] | null = null;
  if (detailKind) {
    const rows = (byKind.get(detailKind)?.cur ?? []).slice();
    const byWeek = new Map<string, MailRow[]>();
    for (const r of rows) {
      const w = weekOf(r.sent_at);
      byWeek.set(w, [...(byWeek.get(w) ?? []), r]);
    }
    weeks = [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, list]) => {
        const s = summarize(list, bookingsByEmail);
        return { week, sent: s.sent, opened: s.opened, clicked: s.clicked, booked: s.booked };
      });
  }

  return { period, since: since?.toISOString() ?? null, kinds, weeks };
}

/** The preview page for a kind of mail, when there is one. */
export const EMAIL_PREVIEW_PATHS: Record<string, string> = {
  Bevestiging: "/email-preview/sunday-table-confirmation",
  Annulering: "/email-preview/sunday-table-cancel",
  Verplaatst: "/email-preview/booking-moved",
  "+1 erbij": "/email-preview/sunday-table-plus-one",
  "+1 eraf": "/email-preview/sunday-table-plus-one",
  Locatie: "/email-preview/sunday-table-location",
  Vragen: "/email-preview/sunday-table-intro-request",
  Review: "/email-preview/sunday-table-review",
  Uitnodiging: "/email-preview/sunday-table-waitlist-invite",
  "Boeken open": "/email-preview/sunday-table-waitlist-invite",
  Wachtlijst: "/email-preview/sunday-table-waitlist-welcome",
  Welkom: "/email-preview/account-welcome",
  "Lid geworden": "/email-preview/membership",
  Lidmaatschap: "/email-preview/membership",
  Opzegging: "/email-preview/membership",
  "Niet gekomen": "/email-preview/membership",
};
