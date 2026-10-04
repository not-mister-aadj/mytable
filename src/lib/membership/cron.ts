import { and, eq, gt, inArray, isNull, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { eventNotifySignups, events, memberships } from "@/db/schema";
import { markEventSignupNotified } from "@/lib/event-notify-signups";
import { REMINDER_DAYS_BEFORE, selectRenewalReminders } from "@/lib/membership/logic";
import { claimMembershipFlag, releaseMembershipFlag } from "@/lib/membership/data";
import { sendMembershipReminderEmail, sendOpenForEveryoneEmail } from "@/lib/membership/mails";
import { syncMembershipSubscription } from "@/lib/membership/fulfill";
import { captureCriticalError } from "@/lib/sentry/critical";

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

/**
 * People who tapped "Houd me op de hoogte" on a table during the members'
 * 48 hours hear when it opens for them (only while seats are left).
 */
export async function sendEarlyAccessOpenMails(now = new Date()): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  const opened = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(events.workflowStatus, "published"),
        lte(events.membersOnlyUntil, now),
        gt(events.membersOnlyUntil, new Date(now.getTime() - DAY_MS)),
        gt(events.startsAt, now),
        sql`${events.spotsSold} < ${events.capacity}`,
        sql`coalesce((${events.extras} ->> 'comingSoon')::boolean, false) = false`,
      ),
    );
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
          lte(eventNotifySignups.createdAt, event.membersOnlyUntil!),
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
