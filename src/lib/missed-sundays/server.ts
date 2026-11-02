import { and, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { bookings, customers, events } from "@/db/schema";
import { MembershipEmail } from "@/emails/MembershipEmail";
import { logCustomerActivity } from "@/lib/customers/activities";
import { onEmailSent } from "@/lib/customers/hooks";
import { normalizeEmail } from "@/lib/customers/normalize";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { isSharedTableType } from "@/lib/event-concepts";
import { mailSunday } from "@/lib/membership/mail-copy";
import {
  blockMonths,
  isLateCancel,
  LATE_CANCEL_HOURS,
  MISS_POLICY_START,
  MISS_WINDOW_DAYS,
  missOutcome,
  type MissKind,
  type MissOutcome,
} from "@/lib/missed-sundays/logic";
import { missedSundayMail } from "@/lib/missed-sundays/mail-copy";

/**
 * Records a late cancel or a no-show on a booking and applies the policy in
 * logic.ts: a warning or a block on the customer, a line in their history
 * and the mail. Returns null when it doesn't count (not a Sunday, before the
 * policy, not late, or a member's no-show, which membership/no-show.ts handles).
 */
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
  const member = Boolean(row.booking.membershipId);
  if (input.kind === "no_show" && member) return null;

  const prior = await countMisses(row.booking.email, input.kind, now, row.booking.id);
  const outcome = missOutcome(input.kind, prior, member, now);
  const { id: customerId } = await upsertCustomerFromEmail({ email: row.booking.email, customerName: row.booking.customerName });
  if (outcome.kind !== "warning") {
    const until = outcome.until.toISOString();
    await db
      .update(customers)
      .set({ bookingBlockedUntil: sql`GREATEST(coalesce(${customers.bookingBlockedUntil}, ${until}::timestamptz), ${until}::timestamptz)`, updatedAt: now })
      .where(eq(customers.id, customerId));
  }
  const day = mailSunday(row.event.startsAt, "nl");
  await logCustomerActivity({
    customerId,
    type: CustomerActivityTypes.sundayMissed,
    title: input.kind === "late" ? "Laat afgezegd" : "Niet gekomen",
    description:
      outcome.kind === "warning"
        ? `${day} · waarschuwing`
        : `${day} · niet boeken tot ${outcome.until.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" })}`,
    metadata: { bookingId: row.booking.id, kind: input.kind, outcome: outcome.kind },
  });

  const months = outcome.kind === "warning" ? (member ? 1 : 3) : blockMonths(input.kind, outcome, member);
  const locale = await resolveEmailLocale({ email: row.booking.email, fallbackLocale: row.booking.locale });
  const [customer] = await db.select({ firstName: customers.firstName }).from(customers).where(eq(customers.id, customerId)).limit(1);
  const firstName = customer?.firstName ?? row.booking.customerName?.trim().split(/\s+/)[0] ?? null;
  const mail = missedSundayMail({ locale, firstName, kind: input.kind, outcome, months, member, sunday: row.event.startsAt });
  const ok = await sendSimpleEmail({ to: row.booking.email, subject: mail.subject, element: MembershipEmail(mail.props) }).catch(() => false);
  if (ok) await onEmailSent({ customerId, subject: `Gemiste zondag: ${mail.subject}` }).catch(() => undefined);
  return outcome;
}

/** Misses of this kind that still count for this email, this booking left out. */
async function countMisses(email: string, kind: MissKind, now: Date, exceptBookingId: string): Promise<number> {
  const since = new Date(Math.max(MISS_POLICY_START.getTime(), now.getTime() - MISS_WINDOW_DAYS * 86_400_000));
  const missed =
    kind === "late"
      ? and(isNotNull(bookings.cancelledLateAt), sql`${bookings.cancelledLateAt} > ${events.startsAt} - make_interval(hours => ${LATE_CANCEL_HOURS})`)
      : isNotNull(bookings.noShowAt);
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        sql`lower(trim(${bookings.email})) = ${normalizeEmail(email)}`,
        ne(bookings.id, exceptBookingId),
        isNull(bookings.missWaivedAt),
        sql`${events.startsAt} >= ${since.toISOString()}::timestamptz`,
        missed,
      ),
    );
  return row?.n ?? 0;
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
export async function liftBookingBlock(customerId: string): Promise<void> {
  await getDb().update(customers).set({ bookingBlockedUntil: null, updatedAt: new Date() }).where(eq(customers.id, customerId));
  await logCustomerActivity({ customerId, type: CustomerActivityTypes.bookingUnblocked, title: "Mag weer boeken" });
}

/** Admin: strike one missed Sunday so it no longer counts (a block stays until lifted). */
export async function waiveMissedSunday(bookingId: string): Promise<void> {
  await getDb().update(bookings).set({ missWaivedAt: new Date() }).where(and(eq(bookings.id, bookingId), isNull(bookings.missWaivedAt)));
}

export type MissedSundayRow = { bookingId: string; kind: MissKind; startsAt: string; city: string; waived: boolean };

/** For the customer page: their missed Sundays since the policy, and a block. */
export async function loadMissedSundays(email: string, now = new Date()): Promise<{ rows: MissedSundayRow[]; blockedUntil: string | null }> {
  const rows = (await getDb().execute(sql`
    select b.id, e.starts_at, e.city, b.miss_waived_at is not null as waived,
      case when b.no_show_at is not null then 'no_show' else 'late' end as kind
    from bookings b join events e on e.id = b.event_id
    where lower(trim(b.email)) = ${normalizeEmail(email)} and e.starts_at >= ${MISS_POLICY_START.toISOString()}::timestamptz
      and (b.no_show_at is not null or (b.cancelled_late_at is not null and b.cancelled_late_at > e.starts_at - make_interval(hours => ${LATE_CANCEL_HOURS})))
    order by e.starts_at desc`)) as unknown as Array<{ id: string; starts_at: string | Date; city: string; waived: boolean; kind: MissKind }>;
  const until = await bookingBlockedUntil(email, now);
  return {
    rows: rows.map((r) => ({ bookingId: r.id, kind: r.kind, startsAt: new Date(r.starts_at).toISOString(), city: r.city, waived: r.waived })),
    blockedUntil: until?.toISOString() ?? null,
  };
}
