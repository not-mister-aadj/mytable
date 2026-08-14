import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db/index";
import {
  clubMemberships,
  sundayTableSignups,
  type ClubMembership,
  type ClubPlanId,
  type SundayTableSignupProfile,
} from "@/db/schema";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import {
  CLUB_PLAN_PRICING,
  clubPlanPeriodEndFrom,
  isClubPlanId,
  isOneTimeClubPlan,
} from "@/lib/club/plans";
import {
  isSundayTableRsvpOpen,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

export type MemberSundaySignup = {
  id: string;
  city: string;
  tableDate: string;
  tableType: "girls_only" | "mixed";
  planId: string;
  status: string;
  plusOne: boolean;
  cancelledAt: string | null;
  createdAt: string;
};

/** True while status is live and the prepaid/subscription window has not ended. */
export function isMembershipCurrentlyActive(
  row: Pick<
    ClubMembership,
    "status" | "currentPeriodEnd" | "stripeSubscriptionId"
  >,
  now: Date = new Date(),
): boolean {
  if (row.status !== "active" && row.status !== "past_due") return false;
  if (
    row.currentPeriodEnd &&
    row.currentPeriodEnd.getTime() <= now.getTime()
  ) {
    // Recurring past_due can still be in grace with Stripe; prepaid is done.
    if (!row.stripeSubscriptionId) return false;
    return row.status === "past_due";
  }
  return true;
}

/** Prepaid trial/pass with no Stripe subscription to renew. */
export function isOneTimeMembership(
  row: Pick<ClubMembership, "stripeSubscriptionId" | "planId">,
): boolean {
  if (row.stripeSubscriptionId) return false;
  return isClubPlanId(row.planId) && isOneTimeClubPlan(row.planId);
}

function periodEndFromSubscription(
  sub: Stripe.Subscription,
): Date | null {
  const raw = readSubscriptionUnix(sub, "current_period_end");
  if (!raw) return null;
  return new Date(raw * 1000);
}

function cancelAtPeriodEndFromSubscription(sub: Stripe.Subscription): boolean {
  const s = sub as Stripe.Subscription & {
    cancel_at_period_end?: boolean;
    cancel_at?: number | null;
  };
  if (s.cancel_at_period_end === true) return true;
  if (typeof s.cancel_at === "number" && s.cancel_at > 0) return true;
  return false;
}

function readSubscriptionUnix(
  sub: Stripe.Subscription,
  key: "current_period_end",
): number | null {
  const top = (sub as Stripe.Subscription & Record<string, unknown>)[key];
  if (typeof top === "number") return top;
  const item = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  if (typeof item?.current_period_end === "number") {
    return item.current_period_end;
  }
  return null;
}

export async function getActiveMembershipForUser(input: {
  userId?: string | null;
  email: string;
}): Promise<ClubMembership | null> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  let row: ClubMembership | undefined;

  if (input.userId) {
    const byUser = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.userId, input.userId),
          sql`${clubMemberships.status} in ('active', 'past_due')`,
        ),
      )
      .orderBy(desc(clubMemberships.createdAt))
      .limit(1);
    row = byUser[0];
  }

  if (!row) {
    const byEmail = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          sql`lower(${clubMemberships.email}) = ${email}`,
          sql`${clubMemberships.status} in ('active', 'past_due')`,
        ),
      )
      .orderBy(desc(clubMemberships.createdAt))
      .limit(1);
    row = byEmail[0];
  }

  if (!row) return null;

  if (!isMembershipCurrentlyActive(row)) {
    // Prepaid pass ended — flip status so checkout can sell again.
    if (!row.stripeSubscriptionId && row.status === "active") {
      await db
        .update(clubMemberships)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(clubMemberships.id, row.id));
    }
    return null;
  }

  return row;
}

export async function getMemberSundaySignups(input: {
  userId?: string | null;
  email: string;
}): Promise<MemberSundaySignup[]> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const rows = await db
    .select()
    .from(sundayTableSignups)
    .where(
      input.userId
        ? sql`(${sundayTableSignups.userId} = ${input.userId} or lower(${sundayTableSignups.email}) = ${email})`
        : sql`lower(${sundayTableSignups.email}) = ${email}`,
    )
    .orderBy(desc(sundayTableSignups.tableDate), desc(sundayTableSignups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    city: row.city,
    tableDate:
      typeof row.tableDate === "string"
        ? row.tableDate.slice(0, 10)
        : String(row.tableDate).slice(0, 10),
    tableType:
      row.tableType === "girls_only" || row.tableType === "mixed"
        ? row.tableType
        : "mixed",
    planId: row.planId,
    status: row.status,
    plusOne: row.plusOne,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

function memberSignupOwnerFilter(
  email: string,
  userId?: string | null,
) {
  return userId
    ? sql`(${sundayTableSignups.userId} = ${userId} or lower(${sundayTableSignups.email}) = ${email})`
    : sql`lower(${sundayTableSignups.email}) = ${email}`;
}

/**
 * One physical seat per Sunday: only one confirmed RSVP per calendar date.
 * Confirming `keepSignupId` cancels other confirmed/pending RSVPs that day.
 * No cancel email here — this is an automatic seat swap, not a member opt-out.
 */
export async function releaseOtherSignupsOnSameDate(input: {
  keepSignupId: string;
  email: string;
  userId?: string | null;
  tableDate: string;
}): Promise<void> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const tableDate = input.tableDate.slice(0, 10);

  const toCancel = await db
    .select({ id: sundayTableSignups.id })
    .from(sundayTableSignups)
    .where(
      and(
        memberSignupOwnerFilter(email, input.userId),
        eq(sundayTableSignups.tableDate, tableDate),
        ne(sundayTableSignups.id, input.keepSignupId),
        inArray(sundayTableSignups.status, ["confirmed", "pending_payment"]),
      ),
    );

  if (toCancel.length === 0) return;

  await db
    .update(sundayTableSignups)
    .set({
      status: "cancelled",
      plusOne: false,
      cancelledAt: new Date(),
    })
    .where(
      inArray(
        sundayTableSignups.id,
        toCancel.map((row) => row.id),
      ),
    );
}

/**
 * Heal duplicate "Je gaat" rows (same date). Keeps the newest confirmed RSVP.
 */
export async function enforceOneConfirmedPerDate(input: {
  email: string;
  userId?: string | null;
}): Promise<number> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const confirmed = await db
    .select({
      id: sundayTableSignups.id,
      tableDate: sundayTableSignups.tableDate,
      createdAt: sundayTableSignups.createdAt,
    })
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        memberSignupOwnerFilter(email, input.userId),
      ),
    )
    .orderBy(desc(sundayTableSignups.createdAt));

  const keepByDate = new Map<string, string>();
  const toCancel: string[] = [];

  for (const row of confirmed) {
    const tableDate =
      typeof row.tableDate === "string"
        ? row.tableDate.slice(0, 10)
        : String(row.tableDate).slice(0, 10);
    const existing = keepByDate.get(tableDate);
    if (!existing) {
      keepByDate.set(tableDate, row.id);
      continue;
    }
    toCancel.push(row.id);
  }

  if (toCancel.length === 0) return 0;

  await db
    .update(sundayTableSignups)
    .set({
      status: "cancelled",
      plusOne: false,
      cancelledAt: new Date(),
    })
    .where(inArray(sundayTableSignups.id, toCancel));

  return toCancel.length;
}

export async function createPendingClubCheckout(input: {
  email: string;
  name?: string | null;
  userId?: string | null;
  planId: ClubPlanId;
  locale: string;
  city: string;
  tableDate: string;
  tableType: "girls_only" | "mixed";
  profile?: SundayTableSignupProfile | null;
}): Promise<{ membershipId: string; signupId: string; newlyConfirmed: boolean }> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || null;

  const { id: customerId } = await upsertCustomerFromEmail({
    email,
    customerName: name || undefined,
    language: input.locale,
    preferredCity: input.city,
  });

  const existingActive = await getActiveMembershipForUser({
    userId: input.userId,
    email,
  });

  let membershipId = existingActive?.id;

  if (
    membershipId &&
    existingActive &&
    existingActive.planId !== input.planId
  ) {
    // Upgrading a prepaid trial: keep the row, point it at the new plan.
    await db
      .update(clubMemberships)
      .set({
        planId: input.planId,
        name,
        userId: input.userId ?? existingActive.userId,
        customerId,
        locale: input.locale,
        updatedAt: new Date(),
      })
      .where(eq(clubMemberships.id, membershipId));
  } else if (!membershipId) {
    const pending = await db
      .select({ id: clubMemberships.id })
      .from(clubMemberships)
      .where(
        and(
          sql`lower(${clubMemberships.email}) = ${email}`,
          eq(clubMemberships.status, "pending"),
        ),
      )
      .orderBy(desc(clubMemberships.createdAt))
      .limit(1);

    if (pending[0]) {
      membershipId = pending[0].id;
      await db
        .update(clubMemberships)
        .set({
          planId: input.planId,
          name,
          userId: input.userId ?? null,
          customerId,
          locale: input.locale,
          updatedAt: new Date(),
        })
        .where(eq(clubMemberships.id, pending[0].id));
    } else {
      const [membership] = await db
        .insert(clubMemberships)
        .values({
          email,
          name,
          userId: input.userId ?? null,
          customerId,
          planId: input.planId,
          status: "pending",
          locale: input.locale,
        })
        .returning({ id: clubMemberships.id });
      membershipId = membership!.id;
    }
  }

  // One seat per Sunday: reuse any open RSVP for this date (ignore city/type mismatch).
  const openSignups = await db
    .select({
      id: sundayTableSignups.id,
      status: sundayTableSignups.status,
    })
    .from(sundayTableSignups)
    .where(
      and(
        sql`lower(${sundayTableSignups.email}) = ${email}`,
        eq(sundayTableSignups.tableDate, input.tableDate),
        inArray(sundayTableSignups.status, ["confirmed", "pending_payment"]),
      ),
    )
    .orderBy(desc(sundayTableSignups.createdAt));

  const existingSignup =
    openSignups.find((s) => s.status === "confirmed") ?? openSignups[0] ?? null;

  if (existingSignup) {
    const wasConfirmed = existingSignup.status === "confirmed";
    const status = existingActive
      ? "confirmed"
      : existingSignup.status === "confirmed"
        ? "confirmed"
        : "pending_payment";
    const newlyConfirmed = status === "confirmed" && !wasConfirmed;

    await db
      .update(sundayTableSignups)
      .set({
        name,
        city: input.city,
        tableType: input.tableType,
        planId: input.planId,
        locale: input.locale,
        userId: input.userId ?? null,
        customerId,
        membershipId,
        profile: input.profile ?? null,
        status,
        cancelledAt: status === "confirmed" ? null : undefined,
        ...(existingSignup.status !== "confirmed" && status === "confirmed"
          ? { plusOne: false }
          : {}),
      })
      .where(eq(sundayTableSignups.id, existingSignup.id));

    if (status === "confirmed") {
      await releaseOtherSignupsOnSameDate({
        keepSignupId: existingSignup.id,
        email,
        userId: input.userId,
        tableDate: input.tableDate,
      });
    }

    return {
      membershipId,
      signupId: existingSignup.id,
      newlyConfirmed,
    };
  }

  const [signup] = await db
    .insert(sundayTableSignups)
    .values({
      email,
      name,
      city: input.city,
      tableDate: input.tableDate,
      tableType: input.tableType,
      planId: input.planId,
      locale: input.locale,
      userId: input.userId ?? null,
      customerId,
      membershipId,
      profile: input.profile ?? null,
      status: existingActive ? "confirmed" : "pending_payment",
      plusOne: false,
    })
    .returning({ id: sundayTableSignups.id });

  if (existingActive) {
    await releaseOtherSignupsOnSameDate({
      keepSignupId: signup!.id,
      email,
      userId: input.userId,
      tableDate: input.tableDate,
    });
  }

  return {
    membershipId,
    signupId: signup!.id,
    newlyConfirmed: Boolean(existingActive),
  };
}

export async function attachCheckoutSession(input: {
  membershipId: string;
  signupId: string;
  sessionId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .update(clubMemberships)
    .set({
      stripeCheckoutSessionId: input.sessionId,
      updatedAt: new Date(),
    })
    .where(eq(clubMemberships.id, input.membershipId));

  await db
    .update(sundayTableSignups)
    .set({
      stripeCheckoutSessionId: input.sessionId,
    })
    .where(eq(sundayTableSignups.id, input.signupId));
}

export async function fulfillClubCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<"fulfilled" | "skipped" | "not_found"> {
  if (session.metadata?.mytable_kind !== "club_membership") return "skipped";
  if (session.mode !== "subscription" && session.mode !== "payment") {
    return "skipped";
  }
  if (
    session.mode === "payment" &&
    session.payment_status !== "paid"
  ) {
    return "skipped";
  }

  const membershipId = session.metadata.membership_id;
  const signupId = session.metadata.signup_id;
  if (!membershipId) return "not_found";

  const db = getDb();
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  let periodEnd: Date | null = null;
  let cancelAtPeriodEnd = false;
  let planId: ClubPlanId | null = isClubPlanId(session.metadata.plan_id)
    ? session.metadata.plan_id
    : null;

  if (session.mode === "payment") {
    const resolvedPlan =
      planId && isClubPlanId(planId) ? planId : ("1m" as ClubPlanId);
    planId = resolvedPlan;
    periodEnd = clubPlanPeriodEndFrom(resolvedPlan);
    cancelAtPeriodEnd = true;
  } else if (stripeSubscriptionId) {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    periodEnd = periodEndFromSubscription(sub);
    cancelAtPeriodEnd = cancelAtPeriodEndFromSubscription(sub);
    const metaPlan = sub.metadata?.mytable_plan_id;
    if (isClubPlanId(metaPlan)) planId = metaPlan;
  }

  const [updated] = await db
    .update(clubMemberships)
    .set({
      status: "active",
      stripeCustomerId,
      stripeSubscriptionId:
        session.mode === "payment" ? null : stripeSubscriptionId,
      stripeCheckoutSessionId: session.id,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      ...(planId ? { planId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(clubMemberships.id, membershipId))
    .returning();

  if (!updated) return "not_found";

  if (signupId) {
    await db
      .update(sundayTableSignups)
      .set({
        status: "confirmed",
        membershipId,
        stripeCheckoutSessionId: session.id,
        cancelledAt: null,
      })
      .where(eq(sundayTableSignups.id, signupId));

    const [signup] = await db
      .select()
      .from(sundayTableSignups)
      .where(eq(sundayTableSignups.id, signupId))
      .limit(1);

    if (signup) {
      const tableDate =
        typeof signup.tableDate === "string"
          ? signup.tableDate.slice(0, 10)
          : String(signup.tableDate).slice(0, 10);
      await releaseOtherSignupsOnSameDate({
        keepSignupId: signupId,
        email: updated.email,
        userId: updated.userId,
        tableDate,
      });

      try {
        const { voidSundayTableConfirmationEmail } = await import(
          "@/lib/email/sendSundayTableBookingEmails"
        );
        voidSundayTableConfirmationEmail(signup);
      } catch (err) {
        console.error("[club fulfill] Sunday Table confirmation email", err);
      }
    }
  }

  // Subscribers can join any Sunday Table — never leave other RSVPs pending.
  await confirmPendingSignupsForMember({
    membershipId: updated.id,
    email: updated.email,
    userId: updated.userId,
  });

  try {
    const { captureServerEvent } = await import("@/lib/posthog/server");
    const { PostHogEvents } = await import("@/lib/posthog/events");
    void captureServerEvent(updated.email, PostHogEvents.clubmemberPaid, {
      plan_id: updated.planId,
      locale: updated.locale,
    });
  } catch {
    // ignore analytics errors
  }

  try {
    const { sendMetaCapiClubPurchase } = await import(
      "@/lib/analytics/metaCapi"
    );
    const { CLUB_PLAN_PRICING, isClubPlanId } = await import(
      "@/lib/club/plan-pricing"
    );
    const planId = isClubPlanId(updated.planId) ? updated.planId : "12m";
    const plan = CLUB_PLAN_PRICING[planId];
    const amountTotal =
      typeof session.amount_total === "number" ? session.amount_total : null;
    const value =
      amountTotal != null && amountTotal >= 0
        ? amountTotal / 100
        : plan.amountCents / 100;
    void sendMetaCapiClubPurchase({
      membershipId: updated.id,
      planId,
      email: updated.email,
      name: updated.name,
      city: session.metadata?.city?.trim() || "unknown",
      value,
      currency: (session.currency ?? "eur").toUpperCase(),
      locale: updated.locale === "en" ? "en" : "nl",
      userData: {
        phone: session.customer_details?.phone?.trim() || null,
        externalId: updated.userId,
        fbp: session.metadata?.mt_fbp?.trim() || null,
        fbc: session.metadata?.mt_fbc?.trim() || null,
      },
    });
  } catch (err) {
    console.error("[club fulfill] meta capi purchase", err);
  }

  return "fulfilled";
}

/** Active members: promote pending RSVPs, but still only one confirmed table per date. */
export async function confirmPendingSignupsForMember(input: {
  membershipId: string;
  email: string;
  userId?: string | null;
}): Promise<number> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const pending = await db
    .select({
      id: sundayTableSignups.id,
      tableDate: sundayTableSignups.tableDate,
    })
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.status, "pending_payment"),
        memberSignupOwnerFilter(email, input.userId),
      ),
    )
    .orderBy(asc(sundayTableSignups.createdAt));

  const confirmed = await db
    .select({
      tableDate: sundayTableSignups.tableDate,
    })
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        memberSignupOwnerFilter(email, input.userId),
      ),
    );

  const takenDates = new Set(
    confirmed.map((row) =>
      typeof row.tableDate === "string"
        ? row.tableDate.slice(0, 10)
        : String(row.tableDate).slice(0, 10),
    ),
  );

  let confirmedCount = 0;
  for (const row of pending) {
    const tableDate =
      typeof row.tableDate === "string"
        ? row.tableDate.slice(0, 10)
        : String(row.tableDate).slice(0, 10);

    if (takenDates.has(tableDate)) {
      await db
        .update(sundayTableSignups)
        .set({
          status: "cancelled",
          plusOne: false,
          cancelledAt: new Date(),
        })
        .where(eq(sundayTableSignups.id, row.id));
      continue;
    }

    await db
      .update(sundayTableSignups)
      .set({
        status: "confirmed",
        membershipId: input.membershipId,
        cancelledAt: null,
      })
      .where(eq(sundayTableSignups.id, row.id));

    const [confirmed] = await db
      .select()
      .from(sundayTableSignups)
      .where(eq(sundayTableSignups.id, row.id))
      .limit(1);
    if (confirmed) {
      try {
        const { voidSundayTableConfirmationEmail } = await import(
          "@/lib/email/sendSundayTableBookingEmails"
        );
        voidSundayTableConfirmationEmail(confirmed);
      } catch (err) {
        console.error("[club] Sunday Table confirmation email", err);
      }
    }

    takenDates.add(tableDate);
    confirmedCount += 1;
  }

  return confirmedCount;
}

export async function syncClubMembershipFromSubscription(
  sub: Stripe.Subscription,
): Promise<void> {
  const db = getDb();
  const membershipId = sub.metadata?.membership_id;
  const status =
    sub.status === "active" || sub.status === "trialing"
      ? "active"
      : sub.status === "past_due"
        ? "past_due"
        : sub.status === "canceled" || sub.status === "unpaid"
          ? "canceled"
          : null;

  if (!status) return;

  const metaPlan = sub.metadata?.plan_id ?? sub.metadata?.mytable_plan_id;
  const patch = {
    status: status as "active" | "past_due" | "canceled",
    currentPeriodEnd: periodEndFromSubscription(sub),
    cancelAtPeriodEnd: cancelAtPeriodEndFromSubscription(sub),
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    updatedAt: new Date(),
    ...(isClubPlanId(metaPlan) ? { planId: metaPlan } : {}),
  };

  if (membershipId) {
    await db
      .update(clubMemberships)
      .set(patch)
      .where(eq(clubMemberships.id, membershipId));
    return;
  }

  await db
    .update(clubMemberships)
    .set(patch)
    .where(eq(clubMemberships.stripeSubscriptionId, sub.id));
}

export type MembershipStripeRefresh = {
  membership: ClubMembership;
  pendingPlanId: ClubPlanId | null;
};

function pendingPlanFromSubscription(
  sub: Stripe.Subscription,
): ClubPlanId | null {
  const pending = sub.metadata?.pending_plan_id?.trim();
  if (!pending || !isClubPlanId(pending)) return null;
  if (pending === sub.metadata?.plan_id) return null;
  return pending;
}

function currentPriceIdFromSubscription(
  sub: Stripe.Subscription,
): string | null {
  const price = sub.items.data[0]?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

/** Pull latest cancel/renewal state from Stripe (portal changes + missed webhooks). */
export async function refreshMembershipFromStripe(
  membership: ClubMembership,
): Promise<MembershipStripeRefresh> {
  if (!membership.stripeSubscriptionId) {
    return { membership, pendingPlanId: null };
  }

  try {
    const { getStripe, isStripeConfigured } = await import("@/lib/stripe");
    if (!isStripeConfigured()) {
      return { membership, pendingPlanId: null };
    }
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(
      membership.stripeSubscriptionId,
    );
    await syncClubMembershipFromSubscription(sub);

    const db = getDb();
    const [fresh] = await db
      .select()
      .from(clubMemberships)
      .where(eq(clubMemberships.id, membership.id))
      .limit(1);
    return {
      membership: fresh ?? membership,
      pendingPlanId: pendingPlanFromSubscription(sub),
    };
  } catch (err) {
    console.error("[club] refreshMembershipFromStripe", err);
    return { membership, pendingPlanId: null };
  }
}

/**
 * Schedule an upgrade to 12m at the end of the current billing period.
 * Downgrades are not allowed.
 */
export async function changeClubMembershipPlan(input: {
  membershipId: string;
  planId: ClubPlanId;
  locale?: "nl" | "en";
}): Promise<
  | { ok: true; membership: ClubMembership; pendingPlanId: ClubPlanId | null }
  | { error: string }
> {
  if (input.planId !== "12m") {
    return { error: "Only upgrades to 12 months are allowed" };
  }

  const db = getDb();
  const [membership] = await db
    .select()
    .from(clubMemberships)
    .where(eq(clubMemberships.id, input.membershipId))
    .limit(1);

  if (!membership?.stripeSubscriptionId) {
    return { error: "No active subscription" };
  }
  if (membership.planId === "12m") {
    return { ok: true, membership, pendingPlanId: null };
  }
  if (membership.cancelAtPeriodEnd) {
    return { error: "Cancel renewal before upgrading" };
  }
  if (!isClubPlanId(membership.planId)) {
    return { error: "Invalid current plan" };
  }
  if (
    CLUB_PLAN_PRICING[membership.planId as ClubPlanId].intervalCount >=
    CLUB_PLAN_PRICING["12m"].intervalCount
  ) {
    return { error: "Already on longest plan" };
  }

  const { getStripe, isStripeConfigured } = await import("@/lib/stripe");
  const { getOrCreateClubPriceId } = await import("@/lib/club/plans");
  if (!isStripeConfigured()) return { error: "Payments are not configured" };

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(
    membership.stripeSubscriptionId,
  );

  if (cancelAtPeriodEndFromSubscription(sub)) {
    return { error: "Cancel renewal before upgrading" };
  }

  const existingPending = pendingPlanFromSubscription(sub);
  if (existingPending === "12m") {
    return { ok: true, membership, pendingPlanId: "12m" };
  }

  const currentPriceId = currentPriceIdFromSubscription(sub);
  const periodEndUnix = readSubscriptionUnix(sub, "current_period_end");
  if (!currentPriceId || !periodEndUnix) {
    return { error: "Subscription period missing" };
  }

  const nextPriceId = await getOrCreateClubPriceId(
    "12m",
    input.locale ?? "nl",
  );

  const baseMeta: Record<string, string> = {
    ...sub.metadata,
    mytable_kind: "club_membership",
    membership_id: membership.id,
  };

  let schedule: Stripe.SubscriptionSchedule;
  if (sub.schedule) {
    const scheduleId =
      typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
    schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (schedule.status !== "active" && schedule.status !== "not_started") {
      schedule = await stripe.subscriptionSchedules.create({
        from_subscription: sub.id,
      });
    }
  } else {
    schedule = await stripe.subscriptionSchedules.create({
      from_subscription: sub.id,
    });
  }

  const currentPhase = schedule.phases[0];
  if (!currentPhase) return { error: "Subscription schedule missing phase" };

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        start_date: currentPhase.start_date,
        end_date: periodEndUnix,
        items: [{ price: currentPriceId, quantity: 1 }],
        metadata: {
          ...baseMeta,
          plan_id: membership.planId,
          mytable_plan_id: membership.planId,
          pending_plan_id: "12m",
        },
      },
      {
        start_date: periodEndUnix,
        items: [{ price: nextPriceId, quantity: 1 }],
        metadata: {
          ...baseMeta,
          plan_id: "12m",
          mytable_plan_id: "12m",
          pending_plan_id: "",
        },
      },
    ],
  });

  try {
    await stripe.subscriptions.update(sub.id, {
      metadata: {
        ...baseMeta,
        plan_id: membership.planId,
        mytable_plan_id: membership.planId,
        pending_plan_id: "12m",
      },
    });
  } catch (err) {
    // Subscription may already be schedule-managed; phase metadata still carries pending_plan_id.
    console.warn("[club] pending metadata via subscription.update", err);
  }

  return { ok: true, membership, pendingPlanId: "12m" };
}

export async function abandonPendingCheckoutSession(
  sessionId: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(sundayTableSignups)
    .set({
      status: "cancelled",
      plusOne: false,
      cancelledAt: new Date(),
    })
    .where(
      and(
        eq(sundayTableSignups.stripeCheckoutSessionId, sessionId),
        eq(sundayTableSignups.status, "pending_payment"),
      ),
    );

  // Abandoned checkout is not a subscription — clear pending membership rows.
  await db
    .update(clubMemberships)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(clubMemberships.stripeCheckoutSessionId, sessionId),
        eq(clubMemberships.status, "pending"),
      ),
    );
}

/** Mark abandoned pending club checkouts as canceled after the Stripe session TTL. */
export async function expireStalePendingClubMemberships(
  olderThanMs: number = 24 * 60 * 60 * 1000,
): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - olderThanMs);
  const expired = await db
    .update(clubMemberships)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(clubMemberships.status, "pending"),
        sql`${clubMemberships.createdAt} < ${cutoff}`,
      ),
    )
    .returning({ id: clubMemberships.id });
  return expired.length;
}

export async function updateSundayTableRsvp(input: {
  signupId: string;
  email: string;
  userId?: string | null;
  plusOne?: boolean;
  cancel?: boolean;
  reactivate?: boolean;
}): Promise<{ ok: true } | { error: string }> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const [row] = await db
    .select()
    .from(sundayTableSignups)
    .where(eq(sundayTableSignups.id, input.signupId))
    .limit(1);

  if (!row) return { error: "Not found" };
  if (row.email.toLowerCase() !== email) {
    if (!input.userId || row.userId !== input.userId) {
      return { error: "Forbidden" };
    }
  }

  if (row.status === "pending_payment" && !input.cancel && !input.reactivate) {
    return { error: "Payment required" };
  }

  if (input.cancel) {
    await db
      .update(sundayTableSignups)
      .set({
        status: "cancelled",
        plusOne: false,
        cancelledAt: new Date(),
      })
      .where(eq(sundayTableSignups.id, input.signupId));

    if (row.status === "confirmed") {
      try {
        const { after } = await import("next/server");
        const { sendSundayTableCancelEmail } = await import(
          "@/lib/email/sendSundayTableBookingEmails"
        );
        after(() => {
          void sendSundayTableCancelEmail(row).catch((err) => {
            console.error("[club] Sunday Table cancel email", err);
          });
        });
      } catch (err) {
        console.error("[club] Sunday Table cancel email", err);
      }
    }

    return { ok: true };
  }

  const tableDateIso =
    typeof row.tableDate === "string"
      ? row.tableDate.slice(0, 10)
      : String(row.tableDate).slice(0, 10);
  const tableSunday = parseAmsterdamDateIso(tableDateIso);
  const rsvpOpen = tableSunday ? isSundayTableRsvpOpen(tableSunday) : false;

  if (input.reactivate) {
    if (!rsvpOpen) return { error: "Signup closed" };
    const membership = await getActiveMembershipForUser({
      userId: input.userId,
      email,
    });
    if (!membership) return { error: "Active membership required" };
    if (
      row.status !== "cancelled" &&
      row.status !== "pending_payment" &&
      row.status !== "confirmed"
    ) {
      return { error: "Cannot reactivate" };
    }
    await db
      .update(sundayTableSignups)
      .set({
        status: "confirmed",
        cancelledAt: null,
        membershipId: membership.id,
        ...(typeof input.plusOne === "boolean" ? { plusOne: input.plusOne } : {}),
      })
      .where(eq(sundayTableSignups.id, input.signupId));

    await releaseOtherSignupsOnSameDate({
      keepSignupId: input.signupId,
      email,
      userId: input.userId,
      tableDate: tableDateIso,
    });

    const [confirmed] = await db
      .select()
      .from(sundayTableSignups)
      .where(eq(sundayTableSignups.id, input.signupId))
      .limit(1);
    if (confirmed && row.status !== "confirmed") {
      try {
        const { voidSundayTableConfirmationEmail } = await import(
          "@/lib/email/sendSundayTableBookingEmails"
        );
        voidSundayTableConfirmationEmail(confirmed);
      } catch (err) {
        console.error("[club] Sunday Table confirmation email", err);
      }
    }

    return { ok: true };
  }

  if (typeof input.plusOne === "boolean") {
    if (!rsvpOpen) return { error: "Signup closed" };
    if (row.status !== "confirmed") {
      return { error: "Only confirmed RSVPs can bring a +1" };
    }
    if (row.plusOne === input.plusOne) {
      return { ok: true };
    }
    await db
      .update(sundayTableSignups)
      .set({ plusOne: input.plusOne })
      .where(eq(sundayTableSignups.id, input.signupId));

    const [updated] = await db
      .select()
      .from(sundayTableSignups)
      .where(eq(sundayTableSignups.id, input.signupId))
      .limit(1);
    if (updated) {
      try {
        const { after } = await import("next/server");
        const { sendSundayTablePlusOneEmail } = await import(
          "@/lib/email/sendSundayTableBookingEmails"
        );
        const action = input.plusOne ? "added" : "removed";
        // Send after the response so the UI is not blocked on Resend.
        after(() => {
          void sendSundayTablePlusOneEmail(updated, action).then((sent) => {
            if (!sent.ok) {
              console.error("[club] Sunday Table +1 email failed", sent.error);
            }
          });
        });
      } catch (err) {
        console.error("[club] Sunday Table +1 email", err);
      }
    }

    return { ok: true };
  }

  return { error: "Nothing to update" };
}
