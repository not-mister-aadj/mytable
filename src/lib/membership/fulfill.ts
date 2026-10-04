import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, memberships, type Membership } from "@/db/schema";
import { logCustomerActivity } from "@/lib/customers/activities";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { sendMetaCapiSubscribe } from "@/lib/analytics/metaCapi";
import { metaUserDataFromStoredContext } from "@/lib/analytics/metaCapiContext";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { getStripe } from "@/lib/stripe";
import { captureCriticalError, captureCriticalMessage } from "@/lib/sentry/critical";
import { confirmMemberBooking } from "@/lib/membership/bookings";
import {
  claimCancelEmail,
  claimMembershipFlag,
  getMembershipBySubscription,
  releaseMembershipFlag,
  syncMembershipFromSubscription,
} from "@/lib/membership/data";
import {
  sendMembershipCancelledEmail,
  sendMembershipWelcomeEmail,
} from "@/lib/membership/mails";
import { getMembershipPlan, isMembershipPlanId } from "@/lib/membership/plans";
import { ensureMembershipSchedule, subscriptionCancellation } from "@/lib/membership/stripe";

// Fulfilment of membership Checkouts and the subscription webhooks. Every
// function here is idempotent: Stripe retries webhooks and the return page
// runs the same fulfilment as a fallback.

export function isMembershipCheckout(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.kind === "membership";
}

function subscriptionIdOf(value: string | Stripe.Subscription | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export type MembershipFulfillResult =
  | { ok: true; membership: Membership; bookedEventStartsAt: Date | null }
  | { ok: false; reason: "not_paid" | "no_subscription" | "not_a_membership" };

/**
 * checkout.session.completed (mode subscription): creates the membership,
 * attaches the schedule (4m, 12m), books the table chosen on "Kies je
 * zondag" (if any), and sends the welcome mail and Meta Subscribe once.
 */
export async function fulfillMembershipCheckout(session: Stripe.Checkout.Session): Promise<MembershipFulfillResult> {
  if (!isMembershipCheckout(session)) return { ok: false, reason: "not_a_membership" };
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { ok: false, reason: "not_paid" };
  }
  const subscriptionId = subscriptionIdOf(session.subscription);
  if (!subscriptionId) return { ok: false, reason: "no_subscription" };

  const stripe = getStripe();
  let subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const scheduleId = await ensureMembershipSchedule(subscription);
  if (scheduleId && !subscription.schedule) subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const email = (session.customer_details?.email ?? session.customer_email ?? session.metadata?.email ?? "").trim().toLowerCase();
  const locale = session.metadata?.locale === "en" ? "en" : "nl";
  const name = session.metadata?.name?.trim() || session.customer_details?.name?.trim() || undefined;
  const { id: customerId } = await upsertCustomerFromEmail({ email, language: locale, customerName: name });

  const synced = await syncMembershipFromSubscription({
    subscription,
    email,
    userId: session.metadata?.user_id ?? null,
    locale,
    checkoutSessionId: session.id,
    customerId,
    scheduleId,
  });
  if (!synced) return { ok: false, reason: "not_a_membership" };
  let membership = synced.after;
  if (!membership.customerId) {
    const [linked] = await getDb()
      .update(memberships)
      .set({ customerId })
      .where(eq(memberships.id, membership.id))
      .returning();
    if (linked) membership = linked;
  }

  // The table chosen on "Kies je zondag", reserved as a pending booking
  // when the Checkout started.
  let bookedEventStartsAt: Date | null = null;
  const bookingId = session.metadata?.member_booking_id;
  if (bookingId) {
    const confirmed = await confirmMemberBooking({ bookingId, membershipId: membership.id, context: "membership_checkout" });
    if (confirmed.ok) {
      bookedEventStartsAt = confirmed.event.startsAt;
    } else if (confirmed.error === "capacity") {
      await getDb().update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, bookingId));
      await getDb()
        .insert(bookingEvents)
        .values({ bookingId, type: "member_booking_failed", payload: { reason: "capacity", sessionId: session.id } });
      captureCriticalMessage("Membership started but the chosen table was full", {
        flow: "payment",
        step: "membership_table_booking",
        tags: { session_id: session.id, booking_id: bookingId },
      });
    }
  }

  if (await claimMembershipFlag(membership.id, "welcomeEmailSentAt")) {
    const sent = await sendMembershipWelcomeEmail(membership, bookedEventStartsAt).catch(() => false);
    if (!sent) await releaseMembershipFlag(membership.id, "welcomeEmailSentAt");
    await logCustomerActivity({
      customerId,
      type: CustomerActivityTypes.paymentCompleted,
      title: "Lid geworden",
      description: `Lidmaatschap ${membership.plan}`,
      metadata: { membershipId: membership.id, plan: membership.plan, source: session.metadata?.source ?? null },
    }).catch(() => undefined);
    void captureServerEvent(customerId, PostHogEvents.membershipStarted, {
      plan: membership.plan,
      source: session.metadata?.source ?? null,
      with_table: Boolean(bookingId),
      concept: "account",
    });
  }

  if (await claimMembershipFlag(membership.id, "metaSubscribeSentAt")) {
    const md = session.metadata ?? {};
    const stored = { fbp: md.mt_fbp, fbc: md.mt_fbc, clientIpAddress: md.mt_ip, clientUserAgent: md.mt_ua };
    const plan = isMembershipPlanId(membership.plan) ? getMembershipPlan(membership.plan) : null;
    const sent = await sendMetaCapiSubscribe({
      subscriptionId: membership.stripeSubscriptionId ?? membership.id,
      email,
      plan: membership.plan,
      valueCents: plan?.initialCents ?? 0,
      locale,
      userData: metaUserDataFromStoredContext(stored, email, name ?? null, { country: "nl" }),
    }).catch(() => false);
    if (!sent) await releaseMembershipFlag(membership.id, "metaSubscribeSentAt");
  }

  return { ok: true, membership, bookedEventStartsAt };
}

/** Fallback for the return page and the pending-checkout sync. */
export async function tryFulfillMembershipSession(sessionId: string): Promise<MembershipFulfillResult | null> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return await fulfillMembershipCheckout(session);
  } catch (error) {
    captureCriticalError(error, { flow: "payment", step: "membership_fulfill_fallback", tags: { session_id: sessionId } });
    return null;
  }
}

/**
 * customer.subscription.created / updated / deleted, invoice.paid and
 * invoice.payment_failed: bring the row in line with Stripe, keep the
 * schedule in place (also after a "resume" in the Billing Portal), and send
 * the cancellation mail once per end date.
 */
export async function syncMembershipSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  let subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.metadata?.kind !== "membership") return;

  // Only rows we know (a webhook can come before checkout.session.completed;
  // that one creates the row with the email and account).
  const known = await getMembershipBySubscription(subscription.id);
  if (!known) return;

  const scheduleId = await ensureMembershipSchedule(subscription).catch((error: unknown) => {
    captureCriticalError(error, { flow: "payment", step: "membership_schedule", tags: { subscription_id: subscriptionId } });
    return null;
  });
  if (scheduleId && !subscription.schedule) subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const synced = await syncMembershipFromSubscription({ subscription, scheduleId });
  if (!synced) return;
  const { before, after } = synced;

  const { cancelling, endsAt } = subscriptionCancellation(subscription);
  if (cancelling && endsAt && after.status !== "canceled" && endsAt.getTime() > Date.now()) {
    if (await claimCancelEmail(after.id, endsAt)) {
      await sendMembershipCancelledEmail(after, endsAt).catch(() => false);
    }
  }
  if (before && before.status !== after.status && after.customerId) {
    await logCustomerActivity({
      customerId: after.customerId,
      type: after.status === "past_due" ? CustomerActivityTypes.paymentFailed : CustomerActivityTypes.noteAdded,
      title: after.status === "canceled" ? "Lidmaatschap beëindigd" : after.status === "past_due" ? "Lidmaatschap: betaling mislukt" : "Lidmaatschap actief",
      description: `Lidmaatschap ${after.plan}`,
      metadata: { membershipId: after.id, status: after.status },
    }).catch(() => undefined);
  }
}

/** The subscription id behind an invoice (API 2025+: under parent). */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

