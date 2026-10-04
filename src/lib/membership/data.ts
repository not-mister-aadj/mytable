import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, isDbConfigured } from "@/db/index";
import { memberships, type Membership } from "@/db/schema";
import {
  isMembershipStatus,
  membershipStatusFromStripe,
  type MembershipSnapshot,
} from "@/lib/membership/logic";
import { isMembershipPlanId, type MembershipPlanId } from "@/lib/membership/plans";
import {
  stripeCustomerId,
  subscriptionCancellation,
  subscriptionPeriodEnd,
  subscriptionPlan,
  subscriptionScheduleId,
} from "@/lib/membership/stripe";

// Server side of the membership table. Only ever looked up for the
// signed-in person (by auth user id) or from Stripe webhooks.

export function membershipSnapshot(row: Membership | null): MembershipSnapshot | null {
  if (!row || !isMembershipPlanId(row.plan) || !isMembershipStatus(row.status)) return null;
  return {
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    initialPeriodEnd: row.initialPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    bookingBlockedUntil: row.bookingBlockedUntil,
    noShowCount: row.noShowCount,
    reminderSentAt: row.reminderSentAt,
  };
}

/** The person's running membership (active or payment problem), else the
 * most recent ended one, else null. */
export async function getMembershipForUser(userId: string): Promise<Membership | null> {
  if (!isDbConfigured()) return null;
  const rows = await getDb()
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.createdAt))
    .limit(5);
  return rows.find((r) => r.status !== "canceled") ?? rows[0] ?? null;
}

/** A running membership for this account, if any. */
export async function getRunningMembershipForUser(userId: string): Promise<Membership | null> {
  if (!isDbConfigured()) return null;
  const [row] = await getDb()
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), ne(memberships.status, "canceled")))
    .limit(1);
  return row ?? null;
}

export async function getMembershipById(id: string): Promise<Membership | null> {
  const [row] = await getDb().select().from(memberships).where(eq(memberships.id, id)).limit(1);
  return row ?? null;
}

export async function getMembershipBySubscription(subscriptionId: string): Promise<Membership | null> {
  const [row] = await getDb()
    .select()
    .from(memberships)
    .where(eq(memberships.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return row ?? null;
}

/** An earlier Stripe customer for this account or email, so a returning
 * member keeps one customer (and one invoice history). */
export async function previousStripeCustomerId(input: { userId: string; email: string }): Promise<string | null> {
  if (!isDbConfigured()) return null;
  const [row] = await getDb()
    .select({ id: memberships.stripeCustomerId })
    .from(memberships)
    .where(
      and(
        or(eq(memberships.userId, input.userId), sql`lower(${memberships.email}) = ${input.email.trim().toLowerCase()}`),
        sql`${memberships.stripeCustomerId} IS NOT NULL`,
      ),
    )
    .orderBy(desc(memberships.createdAt))
    .limit(1);
  return row?.id ?? null;
}

export type SubscriptionSyncInput = {
  subscription: Stripe.Subscription;
  /** From the Checkout session (first time only). */
  email?: string | null;
  userId?: string | null;
  locale?: "nl" | "en";
  checkoutSessionId?: string | null;
  customerId?: string | null;
  scheduleId?: string | null;
};

/**
 * Creates or updates the membership row for a Stripe subscription. Safe to
 * call for every webhook in any order: keyed on the subscription id, and
 * the first period end is only set once (while the subscription is still on
 * its first-period price). Returns the row before and after, or null when
 * the subscription is not a membership or has no usable status yet.
 */
export async function syncMembershipFromSubscription(
  input: SubscriptionSyncInput,
): Promise<{ before: Membership | null; after: Membership } | null> {
  const sub = input.subscription;
  if (sub.metadata?.kind !== "membership") return null;
  const status = membershipStatusFromStripe(sub.status);
  const plan: MembershipPlanId | null = subscriptionPlan(sub);
  if (!status || !plan) return null;

  const db = getDb();
  const before = await getMembershipBySubscription(sub.id);
  const periodEnd = subscriptionPeriodEnd(sub);
  const { cancelling, endsAt } = subscriptionCancellation(sub);
  const scheduleId = input.scheduleId ?? subscriptionScheduleId(sub) ?? before?.stripeScheduleId ?? null;
  const onFirstPeriod = sub.items.data[0]?.price.lookup_key?.endsWith("_initial") || plan === "1m";
  const now = new Date();

  // A cancellation that has an end date: show that date as the period end.
  const currentPeriodEnd = cancelling && endsAt ? endsAt : periodEnd;

  if (before) {
    const [after] = await db
      .update(memberships)
      .set({
        status,
        plan,
        stripeCustomerId: stripeCustomerId(sub),
        stripeScheduleId: scheduleId,
        currentPeriodEnd,
        cancelAtPeriodEnd: cancelling,
        initialPeriodEnd: before.initialPeriodEnd ?? (onFirstPeriod ? periodEnd : null),
        ...(input.customerId && !before.customerId ? { customerId: input.customerId } : {}),
        ...(input.checkoutSessionId && !before.stripeCheckoutSessionId
          ? { stripeCheckoutSessionId: input.checkoutSessionId }
          : {}),
        updatedAt: now,
      })
      .where(eq(memberships.id, before.id))
      .returning();
    return { before, after: after! };
  }

  const userId = input.userId ?? sub.metadata?.user_id ?? null;
  const email = (input.email ?? sub.metadata?.email ?? "").trim().toLowerCase();
  if (!email) return null;
  const locale = input.locale ?? (sub.metadata?.locale === "en" ? "en" : "nl");

  const [inserted] = await db
    .insert(memberships)
    .values({
      userId,
      email,
      customerId: input.customerId ?? null,
      plan,
      status,
      locale,
      stripeCustomerId: stripeCustomerId(sub),
      stripeSubscriptionId: sub.id,
      stripeScheduleId: scheduleId,
      stripeCheckoutSessionId: input.checkoutSessionId ?? null,
      initialPeriodEnd: onFirstPeriod ? periodEnd : null,
      currentPeriodEnd,
      cancelAtPeriodEnd: cancelling,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted) return { before: null, after: inserted };
  // A concurrent webhook inserted it first: update that row instead.
  const row = await getMembershipBySubscription(sub.id);
  if (!row) throw new Error(`Membership row for ${sub.id} could not be created`);
  return syncMembershipFromSubscription(input);
}

/** Claims a one-time flag (e.g. the welcome mail): true for exactly one
 * caller. */
export async function claimMembershipFlag(
  id: string,
  column: "welcomeEmailSentAt" | "reminderSentAt" | "metaSubscribeSentAt",
): Promise<boolean> {
  const col = memberships[column];
  const rows = await getDb()
    .update(memberships)
    .set({ [column]: new Date() })
    .where(and(eq(memberships.id, id), isNull(col)))
    .returning({ id: memberships.id });
  return rows.length > 0;
}

export async function releaseMembershipFlag(
  id: string,
  column: "welcomeEmailSentAt" | "reminderSentAt" | "metaSubscribeSentAt",
): Promise<void> {
  await getDb()
    .update(memberships)
    .set({ [column]: null })
    .where(eq(memberships.id, id));
}

/** Claims the "Opzegging bevestigd" mail for this end date (a member who
 * cancels, resumes and cancels again gets a mail each time the date is
 * new). */
export async function claimCancelEmail(id: string, endsAt: Date): Promise<boolean> {
  const rows = await getDb()
    .update(memberships)
    .set({ cancelEmailSentFor: endsAt })
    .where(
      and(
        eq(memberships.id, id),
        or(isNull(memberships.cancelEmailSentFor), ne(memberships.cancelEmailSentFor, endsAt)),
      ),
    )
    .returning({ id: memberships.id });
  return rows.length > 0;
}

/**
 * Account deletion: a running membership ends right away in Stripe (no
 * further payments; the current period is not refunded) and the rows are
 * unlinked from the deleted account. The rows themselves stay, like
 * bookings, for the administration.
 */
export async function endMembershipsForDeletedAccount(userId: string): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  const rows = await db.select().from(memberships).where(eq(memberships.userId, userId));
  const { getStripe, isStripeConfigured } = await import("@/lib/stripe");
  for (const row of rows) {
    if (row.status !== "canceled" && row.stripeSubscriptionId && isStripeConfigured()) {
      const stripe = getStripe();
      if (row.stripeScheduleId) {
        await stripe.subscriptionSchedules.release(row.stripeScheduleId).catch(() => undefined);
      }
      await stripe.subscriptions.cancel(row.stripeSubscriptionId, { prorate: false });
    }
    await db
      .update(memberships)
      .set({ userId: null, status: "canceled", updatedAt: new Date() })
      .where(eq(memberships.id, row.id));
  }
}
