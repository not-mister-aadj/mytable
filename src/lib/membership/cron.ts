import { and, eq, gt, inArray, isNull, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { eventNotifySignups, events, memberships } from "@/db/schema";
import { markEventSignupNotified } from "@/lib/event-notify-signups";
import { REMINDER_DAYS_BEFORE, selectRenewalReminders } from "@/lib/membership/logic";
import { claimMembershipFlag, releaseMembershipFlag } from "@/lib/membership/data";
import { sendMembershipReminderEmail, sendOpenForEveryoneEmail } from "@/lib/membership/mails";
import { syncMembershipSubscription } from "@/lib/membership/fulfill";
import { captureCriticalError } from "@/lib/sentry/critical";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { bookingOpensOverride, jouwTafelBookingWindow } from "@/lib/jouw-tafel/logic";
import { MEMBERSHIP_OPEN } from "@/lib/membership/plans";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Je lidmaatschap loopt vanaf {datum} per maand door": once per
 * membership, 7 days before the first period ends (4m, 12m). */
export async function sendRenewalReminders(now = new Date()): Promise<{ sent: number; failed: number }> {
  const rows = await getDb()
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.status, "active"),
        inArray(memberships.plan, ["4m", "12m"]),
        isNull(memberships.reminderSentAt),
        eq(memberships.cancelAtPeriodEnd, false),
        gt(memberships.initialPeriodEnd, now),
        lte(memberships.initialPeriodEnd, new Date(now.getTime() + REMINDER_DAYS_BEFORE * DAY_MS)),
      ),
    );
  let sent = 0;
  let failed = 0;
  for (const m of selectRenewalReminders(rows, now.getTime())) {
    if (!(await claimMembershipFlag(m.id, "reminderSentAt"))) continue;
    const ok = await sendMembershipReminderEmail(m).catch(() => false);
    if (ok) sent += 1;
    else {
      failed += 1;
      await releaseMembershipFlag(m.id, "reminderSentAt");
    }
  }
  return { sent, failed };
}

/**
 * Safety net for the schedule: a 4m/12m membership still in its first
 * period without a schedule (a webhook that failed) gets one, so it never
 * renews at the first-period price.
 */
export async function repairMissingSchedules(now = new Date()): Promise<number> {
  const rows = await getDb()
    .select({ subscriptionId: memberships.stripeSubscriptionId })
    .from(memberships)
    .where(
      and(
        ne(memberships.status, "canceled"),
        inArray(memberships.plan, ["4m", "12m"]),
        isNull(memberships.stripeScheduleId),
        eq(memberships.cancelAtPeriodEnd, false),
        gt(memberships.initialPeriodEnd, now),
      ),
    )
    .limit(20);
  let repaired = 0;
  for (const row of rows) {
    if (!row.subscriptionId) continue;
    try {
      await syncMembershipSubscription(row.subscriptionId);
      repaired += 1;
    } catch (error) {
      captureCriticalError(error, { flow: "payment", step: "membership_schedule_repair", tags: { subscription_id: row.subscriptionId } });
    }
  }
  return repaired;
}

/** The moment a Sunday opens for everyone: an admin's exception when there
 * is one, else the end of the members' days (while the membership is on
 * offer), else the usual window. */
export function opensForEveryoneAt(event: { startsAt: Date; membersOnlyUntil: Date | null; extras: unknown }): Date {
  const override = bookingOpensOverride(event.extras);
  if (override) return new Date(override);
  if (MEMBERSHIP_OPEN && event.membersOnlyUntil) return event.membersOnlyUntil;
  return jouwTafelBookingWindow(event.startsAt).everyoneFrom;
}

/**
 * People who tapped "Houd me op de hoogte" on a Sunday before it opened hear
 * when it opens for them (only while seats are left). Also when an admin
 * opened it earlier by hand: the mail goes at that moment, not on the date
 * the window would have opened by itself. Once per person (notified_at).
 */
export async function sendEarlyAccessOpenMails(now = new Date()): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  const bookable = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.experienceType, JOUW_TAFEL_TYPE),
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, now),
        sql`${events.spotsSold} < ${events.capacity}`,
        sql`coalesce((${events.extras} ->> 'comingSoon')::boolean, false) = false`,
        sql`exists (select 1 from ${eventNotifySignups} where ${eventNotifySignups.eventId} = ${events.id} and ${eventNotifySignups.notifiedAt} is null)`,
      ),
    );
  const opened = bookable.map((event) => ({ ...event, openAt: opensForEveryoneAt(event) })).filter((event) => event.openAt.getTime() <= now.getTime());
  let sent = 0;
  let failed = 0;
  for (const event of opened) {
    const signups = await db
      .select()
      .from(eventNotifySignups)
      .where(
        and(
          eq(eventNotifySignups.eventId, event.id),
          isNull(eventNotifySignups.notifiedAt),
          // Only who asked before it opened; a later one is on a full Sunday's waitlist.
          lte(eventNotifySignups.createdAt, event.openAt),
        ),
      );
    for (const signup of signups) {
      const ok = await sendOpenForEveryoneEmail({
        email: signup.email,
        fallbackLocale: signup.locale,
        city: event.city,
        sunday: event.startsAt,
      }).catch(() => false);
      if (ok) {
        sent += 1;
        await markEventSignupNotified(signup.id);
      } else failed += 1;
    }
  }
  return { sent, failed };
}
