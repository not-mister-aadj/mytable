import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { Resend } from "resend";
import { getDb, isDbConfigured } from "@/db/index";
import { bookingEvents, bookings, customers, emailLog, events } from "@/db/schema";
import { MembershipEmail } from "@/emails/MembershipEmail";
import { logCustomerActivity } from "@/lib/customers/activities";
import { onEmailSent } from "@/lib/customers/hooks";
import { normalizeEmail } from "@/lib/customers/normalize";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { sendRendered } from "@/lib/admin/sunday-mails";
import { isSharedTableType } from "@/lib/event-concepts";
import { mailSunday } from "@/lib/membership/mail-copy";
import { isJouwTafelType } from "@/lib/event-concepts";
import { resolveSeatPriceCents } from "@/lib/jouw-tafel/logic";
import {
  isLateCancel,
  LATE_CANCEL_HOURS,
  MISS_POLICY_START,
  MISS_SEAT_PRICE_CENTS,
  MISS_WINDOW_DAYS,
  missMailAt,
  missOutcome,
  nextSeatCostsMore,
  type MissKind,
  type MissOutcome,
} from "@/lib/missed-sundays/logic";
import { missedSundayMail } from "@/lib/missed-sundays/mail-copy";

/**
 * Records a late cancel or a no-show on a booking and applies the policy in
 * logic.ts: a line in their history and the mail (the first time nothing
 * changes, from the second the next seat costs more). Returns null when it
 * doesn't count (not a Sunday, before the policy, not late, or a seat from a
 * membership, which membership/no-show.ts handles).
 */

/** A seat given up after moving closed, or a no-show: what counts as a miss. */
const MISSED_SQL = sql`(${bookings.noShowAt} is not null or (${bookings.cancelledLateAt} is not null and ${bookings.cancelledLateAt} > ${events.startsAt} - make_interval(hours => ${LATE_CANCEL_HOURS})))`;

/** Misses that still count for this email (one booking left out), and the Sunday of the last one. */
async function countedMisses(email: string, now: Date, exceptBookingId?: string): Promise<{ n: number; last: Date | null }> {
  const since = new Date(Math.max(MISS_POLICY_START.getTime(), now.getTime() - MISS_WINDOW_DAYS * 86_400_000));
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int`, last: sql<Date | string | null>`max(${events.startsAt})` })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        sql`lower(trim(${bookings.email})) = ${normalizeEmail(email)}`,
        exceptBookingId ? ne(bookings.id, exceptBookingId) : undefined,
        isNull(bookings.membershipId),
        isNull(bookings.missWaivedAt),
        sql`${events.startsAt} >= ${since.toISOString()}::timestamptz`,
        MISSED_SQL,
      ),
    );
  return { n: row?.n ?? 0, last: row?.last ? new Date(row.last) : null };
}

/**
 * What a Sunday seat costs this email after missed Sundays, or null for the
 * usual price: after a second miss the next seat costs more, until they have
 * come to a Sunday since.
 */
export async function missSeatPriceCents(email: string | null | undefined, now = new Date()): Promise<number | null> {
  if (!email?.trim() || !isDbConfigured()) return null;
  const { n, last } = await countedMisses(email, now);
  if (n < 2 || !last) return null;
  const [came] = await getDb()
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        sql`lower(trim(${bookings.email})) = ${normalizeEmail(email)}`,
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        isNull(bookings.cancelledLateAt),
        isNull(bookings.noShowAt),
        sql`${events.startsAt} > ${last.toISOString()}::timestamptz`,
        sql`${events.startsAt} < ${now.toISOString()}::timestamptz`,
      ),
    )
    .limit(1);
  return nextSeatCostsMore(n, Boolean(came)) ? MISS_SEAT_PRICE_CENTS : null;
}

export async function recordMissedSunday(input: { bookingId: string; kind: MissKind; now?: Date }): Promise<MissOutcome | null> {
  const now = input.now ?? new Date();
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!row || !isSharedTableType(row.event.experienceType)) return null;
  if (row.event.startsAt.getTime() < MISS_POLICY_START.getTime()) return null;
  if (input.kind === "late" && !isLateCancel(now, row.event.startsAt)) return null;
  // A seat from a membership follows the membership's own rule (terms art. 13).
  if (row.booking.membershipId) return null;

  const prior = (await countedMisses(row.booking.email, now, row.booking.id)).n;
  const outcome = missOutcome(prior);
  const normalCents = resolveSeatPriceCents({ eventPriceCents: row.event.priceCents, isJouwTafel: isJouwTafelType(row.event.experienceType) });
  const missCents = Math.max(MISS_SEAT_PRICE_CENTS, normalCents);
  const { id: customerId } = await upsertCustomerFromEmail({ email: row.booking.email, customerName: row.booking.customerName });
  const day = mailSunday(row.event.startsAt, "nl");
  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.sundayMissed,
    title: input.kind === "late" ? "Laat afgezegd" : "Niet gekomen",
    description: outcome.kind === "warning" ? `${day} · eerste keer` : `${day} · volgende plek €${missCents / 100}`,
    metadata: { bookingId: row.booking.id, kind: input.kind, outcome: outcome.kind },
  });

  const locale = await resolveEmailLocale({ email: row.booking.email, fallbackLocale: row.booking.locale });
  const [customer] = await db.select({ firstName: customers.firstName }).from(customers).where(eq(customers.id, customerId)).limit(1);
  const firstName = customer?.firstName ?? row.booking.customerName?.trim().split(/\s+/)[0] ?? null;
  const mail = missedSundayMail({ locale, firstName, kind: input.kind, outcome, normalCents, missCents, sunday: row.event.startsAt });
  // The mail waits for the Monday morning after the Sunday.
  const at = missMailAt(row.event.startsAt, now);
  const resendId = await sendRendered(row.booking.email, mail.subject, MembershipEmail(mail.props), at ?? undefined).catch(() => null);
  if (resendId) {
    if (at) await db.update(emailLog).set({ sentAt: at }).where(eq(emailLog.resendId, resendId));
    await db.insert(bookingEvents).values({ bookingId: row.booking.id, type: "missed_sunday_mail", payload: { resendId, at: at?.toISOString() ?? null } });
    await onEmailSent({ customerId, subject: `Gemiste zondag: ${mail.subject}` }).catch(() => undefined);
  }
  return outcome;
}

/** Until when this email may not book a Sunday, or null. */
export async function bookingBlockedUntil(email: string | null | undefined, now = new Date()): Promise<Date | null> {
  if (!email?.trim() || !isDbConfigured()) return null;
  const [row] = await getDb()
    .select({ until: customers.bookingBlockedUntil })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(email)))
    .limit(1);
  return row?.until && row.until.getTime() > now.getTime() ? row.until : null;
}

/** Admin: lift a block now. */
/** Takes back missed-Sunday mails still waiting for Monday, for these bookings. */
async function cancelPlannedMissMails(bookingIds: string[]): Promise<void> {
  if (bookingIds.length === 0) return;
  const key = process.env.RESEND_FULL_ACCESS_API_KEY?.trim() || process.env.RESEND_READ_API_KEY?.trim();
  if (!key) return;
  const planned = await getDb()
    .select({ payload: bookingEvents.payload })
    .from(bookingEvents)
    .where(and(inArray(bookingEvents.bookingId, bookingIds), eq(bookingEvents.type, "missed_sunday_mail")))
    .orderBy(desc(bookingEvents.createdAt));
  const resend = new Resend(key);
  for (const { payload } of planned) {
    const p = payload as { resendId?: string; at?: string | null } | null;
    if (!p?.resendId || !p.at || new Date(p.at).getTime() <= Date.now()) continue;
    const { error } = await resend.emails.cancel(p.resendId);
    if (!error) await getDb().delete(emailLog).where(eq(emailLog.resendId, p.resendId));
  }
}

export async function liftBookingBlock(customerId: string): Promise<void> {
  const db = getDb();
  await db.update(customers).set({ bookingBlockedUntil: null, updatedAt: new Date() }).where(eq(customers.id, customerId));
  // A block mail still waiting for Monday would now be wrong.
  const [c] = await db.select({ email: customers.emailNormalized }).from(customers).where(eq(customers.id, customerId)).limit(1);
  if (c) {
    const own = await db.select({ id: bookings.id }).from(bookings).where(sql`lower(trim(${bookings.email})) = ${c.email}`);
    await cancelPlannedMissMails(own.map((b) => b.id)).catch(() => undefined);
  }
  await logCustomerActivity({ customerId, type: CustomerActivityTypes.bookingUnblocked, title: "Mag weer boeken" });
}

/** Admin: strike one missed Sunday so it no longer counts (a block stays until lifted). */
export async function waiveMissedSunday(bookingId: string): Promise<void> {
  await getDb().update(bookings).set({ missWaivedAt: new Date() }).where(and(eq(bookings.id, bookingId), isNull(bookings.missWaivedAt)));
  await cancelPlannedMissMails([bookingId]).catch(() => undefined);
}

export type MissedSundayRow = {
  bookingId: string;
  kind: MissKind;
  startsAt: string;
  city: string;
  waived: boolean;
  /** Hours before the start they cancelled (late cancels only). */
  hoursBefore: number | null;
  /** Counts for the policy: since its start, not a member's seat, inside 7 days. */
  counts: boolean;
};

/** For the customer page: every Sunday they cancelled on the table page or did not come to, and what their next seat costs. */
export async function loadMissedSundays(email: string, now = new Date()): Promise<{ rows: MissedSundayRow[]; nextSeatCents: number | null }> {
  const rows = (await getDb().execute(sql`
    select b.id, e.starts_at, e.city, b.miss_waived_at is not null as waived, b.cancelled_late_at,
      case when b.no_show_at is not null then 'no_show' else 'late' end as kind,
      (b.membership_id is null and e.starts_at >= ${MISS_POLICY_START.toISOString()}::timestamptz
        and (b.no_show_at is not null or b.cancelled_late_at > e.starts_at - make_interval(hours => ${LATE_CANCEL_HOURS}))) as counts
    from bookings b join events e on e.id = b.event_id
    where lower(trim(b.email)) = ${normalizeEmail(email)} and (b.no_show_at is not null or b.cancelled_late_at is not null)
    order by e.starts_at desc`)) as unknown as Array<{
    id: string;
    starts_at: string | Date;
    city: string;
    waived: boolean;
    cancelled_late_at: string | Date | null;
    kind: MissKind;
    counts: boolean;
  }>;
  return {
    rows: rows.map((r) => ({
      bookingId: r.id,
      kind: r.kind,
      startsAt: new Date(r.starts_at).toISOString(),
      city: r.city,
      waived: r.waived,
      hoursBefore:
        r.kind === "late" && r.cancelled_late_at
          ? Math.max(0, Math.round((new Date(r.starts_at).getTime() - new Date(r.cancelled_late_at).getTime()) / 3_600_000))
          : null,
      counts: r.counts,
    })),
    nextSeatCents: await missSeatPriceCents(email, now),
  };
}

/** For the customers list: per email, how often they did not come and how often they cancelled inside 7 days. */
export async function missCountsByEmail(): Promise<Map<string, { noShows: number; lateCancels: number }>> {
  const rows = (await getDb().execute(sql`
    select lower(trim(b.email)) as email,
      count(*) filter (where b.no_show_at is not null)::int as no_shows,
      count(*) filter (where b.no_show_at is null and b.cancelled_late_at > e.starts_at - make_interval(hours => ${LATE_CANCEL_HOURS}))::int as late_cancels
    from bookings b join events e on e.id = b.event_id
    where b.no_show_at is not null or b.cancelled_late_at is not null
    group by 1`)) as unknown as Array<{ email: string; no_shows: number; late_cancels: number }>;
  return new Map(rows.map((r) => [r.email, { noShows: r.no_shows, lateCancels: r.late_cancels }]));
}
