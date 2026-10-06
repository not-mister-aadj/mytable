// Refunds made in the Stripe Dashboard and disputed payments (chargebacks),
// from the Stripe webhook. A full refund of a ticket frees its seats; a
// dispute puts the customer's account on hold ("op slot") and drops the
// disputed booking. Everything else (partial refunds, memberships, payments
// we cannot match) is mailed to the admins to decide. Idempotent: Stripe may
// send an event more than once.

import { and, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, customerActivities, events, memberships, type Booking, type Event } from "@/db/schema";
import { MembershipEmail } from "@/emails/MembershipEmail";
import { adminUrl } from "@/lib/admin-url";
import { logCustomerActivity } from "@/lib/customers/activities";
import { setCustomerFrozen } from "@/lib/customers/freeze";
import { onBookingCancelled } from "@/lib/customers/hooks";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { getAdminEmails } from "@/lib/env";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { captureCriticalMessage } from "@/lib/sentry/critical";
import { euros, refundKind } from "@/lib/stripe/refunds-disputes-logic";

type Match = {
  /** Paid, active bookings on this payment (ticket or member guest seat). */
  bookings: { booking: Booking; event: Event }[];
  /** All bookings on this payment, also ones already handled. */
  anyBooking: boolean;
  membership: { id: string; email: string; customerId: string | null } | null;
  email: string | null;
};

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function matchCharge(charge: Stripe.Charge): Promise<Match> {
  const db = getDb();
  const paymentIntentId = idOf(charge.payment_intent);
  const rows = paymentIntentId
    ? await db
        .select({ booking: bookings, event: events })
        .from(bookings)
        .innerJoin(events, eq(bookings.eventId, events.id))
        .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
    : [];
  const active = rows.filter((r) => r.booking.paymentStatus === "paid" && r.booking.lifecycleStatus === "active");
  const customerId = idOf(charge.customer);
  const [membership] =
    rows.length === 0 && customerId
      ? await db
          .select({ id: memberships.id, email: memberships.email, customerId: memberships.customerId })
          .from(memberships)
          .where(eq(memberships.stripeCustomerId, customerId))
          .limit(1)
      : [];
  const email =
    rows[0]?.booking.email ?? membership?.email ?? charge.billing_details?.email ?? charge.receipt_email ?? null;
  return { bookings: active, anyBooking: rows.length > 0, membership: membership ?? null, email: email?.trim().toLowerCase() || null };
}

/** Drops a paid booking: frees its seats, logs why, updates the customer. */
async function dropBooking(
  row: { booking: Booking; event: Event },
  input: { refunded: boolean; type: string; payload: Record<string, unknown> },
): Promise<void> {
  const db = getDb();
  const changed = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(bookings)
      .set({ lifecycleStatus: "removed", ...(input.refunded ? { paymentStatus: "refunded" as const } : {}) })
      .where(and(eq(bookings.id, row.booking.id), eq(bookings.lifecycleStatus, "active"), eq(bookings.paymentStatus, "paid")))
      .returning();
    if (!updated) return null;
    await tx
      .update(events)
      .set({ spotsSold: sql`GREATEST(${events.spotsSold} - ${row.booking.seats}, 0)`, updatedAt: new Date() })
      .where(eq(events.id, row.event.id));
    await tx.insert(bookingEvents).values({ bookingId: row.booking.id, type: input.type, payload: input.payload });
    return updated;
  });
  if (!changed) return;
  revalidateEventPaths(row.event);
  if (changed.customerId) {
    await onBookingCancelled({ customerId: changed.customerId, booking: changed, event: row.event }).catch(() => undefined);
  }
}

function tableLine(event: Event): string {
  const date = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(event.startsAt);
  return `${event.nameNl}, ${event.city}, ${date}`;
}

/** A short mail to the admins (ADMIN_EMAILS, else info@mytable.club). Never
 * throws: a failed mail must not make Stripe resend the event. */
async function mailAdmins(input: {
  subject: string;
  headline: string;
  body: string;
  lines: string[];
  stripeUrl: string;
  customerId?: string | null;
}): Promise<void> {
  const to = getAdminEmails();
  const recipients = to.length > 0 ? to : ["info@mytable.club"];
  const note = input.customerId ? `Klant in admin: ${adminUrl(`/customers/${input.customerId}`)}` : undefined;
  for (const address of recipients) {
    try {
      await sendSimpleEmail({
        to: address,
        subject: input.subject,
        element: MembershipEmail({
          locale: "nl",
          preview: input.subject,
          greeting: "Hoi,",
          headline: input.headline,
          body: input.body,
          details: { label: "Details", lines: input.lines },
          note,
          cta: { href: input.stripeUrl, label: "Open in Stripe", helperText: "Bekijk de betaling in het Stripe-dashboard." },
        }),
      });
    } catch (error) {
      console.error("[stripe] admin mail failed", error);
    }
  }
}

async function chargeOf(stripe: Stripe, value: string | Stripe.Charge): Promise<Stripe.Charge> {
  return typeof value === "string" ? stripe.charges.retrieve(value) : value;
}

// ------------------------------------------------------------------ refunds

/** charge.refunded: a refund made in Stripe (Dashboard or API). */
export async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const match = await matchCharge(charge);
  const kind = refundKind(charge.amount, charge.amount_refunded);
  const stripeUrl = `https://dashboard.stripe.com/payments/${idOf(charge.payment_intent) ?? charge.id}`;
  const payload = { chargeId: charge.id, amountRefunded: charge.amount_refunded, amount: charge.amount };

  if (kind === "full" && match.bookings.length > 0) {
    for (const row of match.bookings) {
      await dropBooking(row, { refunded: true, type: "refunded_in_stripe", payload });
    }
    return;
  }
  // Already handled (a repeat of this event, or refunded in admin first).
  if (kind === "full" && match.anyBooking) return;

  // A partial refund, a membership payment, or a payment we cannot match:
  // logged once per refunded amount, and the admins decide.
  const db = getDb();
  if (match.anyBooking) {
    const rows = match.bookings.length > 0 ? match.bookings : [];
    for (const row of rows) {
      const [seen] = await db
        .select({ id: bookingEvents.id })
        .from(bookingEvents)
        .where(
          and(
            eq(bookingEvents.bookingId, row.booking.id),
            eq(bookingEvents.type, "partially_refunded_in_stripe"),
            sql`${bookingEvents.payload}->>'amountRefunded' = ${String(charge.amount_refunded)}`,
          ),
        )
        .limit(1);
      if (seen) return;
      await db.insert(bookingEvents).values({ bookingId: row.booking.id, type: "partially_refunded_in_stripe", payload });
    }
  } else if (match.membership?.customerId) {
    const [seen] = await db
      .select({ id: customerActivities.id })
      .from(customerActivities)
      .where(
        and(
          eq(customerActivities.customerId, match.membership.customerId),
          eq(customerActivities.type, CustomerActivityTypes.paymentRefunded),
          sql`${customerActivities.metadata}->>'chargeId' = ${charge.id}`,
          sql`${customerActivities.metadata}->>'amountRefunded' = ${String(charge.amount_refunded)}`,
        ),
      )
      .limit(1);
    if (seen) return;
    await logCustomerActivity({
      customerId: match.membership.customerId,
      type: CustomerActivityTypes.paymentRefunded,
      title: "Betaling lidmaatschap terugbetaald",
      description: `${euros(charge.amount_refunded)} van ${euros(charge.amount)}`,
      metadata: payload,
    });
  }

  const what = match.bookings[0]
    ? tableLine(match.bookings[0].event)
    : match.membership
      ? "Lidmaatschap"
      : "Niet gekoppeld aan een boeking of lidmaatschap";
  await mailAdmins({
    subject: `Terugbetaald in Stripe: ${euros(charge.amount_refunded)} (${match.email ?? "onbekend"})`,
    headline: "Terugbetaling om zelf na te kijken",
    body:
      kind === "partial"
        ? "Er is een deel van een betaling terugbetaald. De boeking is blijven staan. Kijk of je iets wilt aanpassen."
        : match.membership
          ? "Er is een betaling voor een lidmaatschap terugbetaald. Het lidmaatschap loopt door. Stop het zelf als dat de bedoeling is."
          : "Er is een betaling terugbetaald die we niet aan een boeking konden koppelen.",
    lines: [
      `${euros(charge.amount_refunded)} terugbetaald van ${euros(charge.amount)}`,
      `Klant: ${match.email ?? "onbekend"}`,
      what,
    ],
    stripeUrl,
    customerId: match.bookings[0]?.booking.customerId ?? match.membership?.customerId ?? null,
  });
}

// ----------------------------------------------------------------- disputes

/** charge.dispute.created: the customer disputed a payment at their bank. */
export async function handleDisputeCreated(stripe: Stripe, dispute: Stripe.Dispute): Promise<void> {
  const charge = await chargeOf(stripe, dispute.charge);
  const match = await matchCharge(charge);
  const db = getDb();

  // Once per dispute: the customer activity carries its id.
  const [seen] = await db
    .select({ id: customerActivities.id })
    .from(customerActivities)
    .where(
      and(
        eq(customerActivities.type, CustomerActivityTypes.paymentDisputed),
        sql`${customerActivities.metadata}->>'disputeId' = ${dispute.id}`,
      ),
    )
    .limit(1);
  if (seen) return;

  const payload = { disputeId: dispute.id, chargeId: charge.id, amount: dispute.amount, reason: dispute.reason };
  for (const row of match.bookings) {
    await dropBooking(row, { refunded: false, type: "dispute_opened", payload });
  }

  let customerId = match.bookings[0]?.booking.customerId ?? match.membership?.customerId ?? null;
  if (match.email) {
    const frozen = await setCustomerFrozen({
      email: match.email,
      on: true,
      reason: `Betaling van ${euros(dispute.amount)} betwist bij de bank (${dispute.reason})`,
      metadata: payload,
    });
    customerId = frozen.customerId;
  } else {
    captureCriticalMessage("Stripe dispute without an email to put on hold", {
      flow: "payment",
      step: "dispute_freeze",
      tags: { dispute_id: dispute.id, charge_id: charge.id },
    });
  }
  if (customerId) {
    await logCustomerActivity({
      customerId,
      type: CustomerActivityTypes.paymentDisputed,
      title: "Betaling betwist",
      description: `${euros(dispute.amount)} · ${dispute.reason}`,
      metadata: payload,
    });
  }

  const dueBy = dispute.evidence_details?.due_by
    ? new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", day: "numeric", month: "short" }).format(
        new Date(dispute.evidence_details.due_by * 1000),
      )
    : null;
  const what = match.bookings[0]
    ? `${tableLine(match.bookings[0].event)} (boeking vervallen, plek vrij)`
    : match.membership
      ? "Lidmaatschap (loopt door)"
      : "Niet gekoppeld aan een boeking of lidmaatschap";
  await mailAdmins({
    subject: `Betaling betwist: ${match.email ?? "onbekend"}, ${euros(dispute.amount)}`,
    headline: "Een klant heeft een betaling betwist",
    body: match.email
      ? "Het account staat nu op slot. De klant kan niets meer boeken tot jij het vrijgeeft in admin."
      : "We konden geen e-mailadres vinden, dus er staat geen account op slot. Kijk het na in Stripe.",
    lines: [
      `${euros(dispute.amount)} betwist`,
      `Klant: ${match.email ?? "onbekend"}`,
      what,
      `Reden volgens de bank: ${dispute.reason}`,
      ...(dueBy ? [`Bewijs insturen kan tot: ${dueBy}`] : []),
    ],
    stripeUrl: `https://dashboard.stripe.com/disputes/${dispute.id}`,
    customerId,
  });
}
