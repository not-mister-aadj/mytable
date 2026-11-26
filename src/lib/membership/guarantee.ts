import { and, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookingFeedback, bookings, memberships } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import { normalizeEmail } from "@/lib/customers/normalize";

/**
 * Member gezelligheidsgarantie: a club member who found nobody gezellig at
 * the table gets their next month free. It applies when, in their finished
 * feedback, they picked nobody they would like to see again, and nobody at
 * that table was someone they had picked after an earlier Sunday.
 *
 * At most once per month per membership. Complimentary memberships have
 * nothing to give back.
 */
export const GUARANTEE_EVENT = "member_guarantee_granted";
const ONCE_PER_DAYS = 30;

/** The rule itself, apart from the database. */
export function guaranteeApplies(input: { pickedNow: string[]; mateEmails: string[]; likedBefore: Set<string> }): boolean {
  if (input.mateEmails.length === 0) return false; // no table, nothing to judge
  if (input.pickedNow.length > 0) return false;
  return !input.mateEmails.some((email) => input.likedBefore.has(normalizeEmail(email)));
}

export type GuaranteeResult =
  | { granted: true; amountCents: number; membershipId: string }
  | { granted: false; reason: string };

export async function grantGuaranteeIfDue(bookingId: string): Promise<GuaranteeResult> {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, membership: memberships, wantToSee: bookingFeedback.wantToSee, completedAt: bookingFeedback.completedAt })
    .from(bookings)
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .innerJoin(bookingFeedback, eq(bookingFeedback.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) return { granted: false, reason: "no member seat with feedback" };
  const { booking, membership } = row;
  if (!row.completedAt) return { granted: false, reason: "feedback not finished" };
  if (membership.complimentary || !membership.stripeSubscriptionId || !membership.stripeCustomerId) {
    return { granted: false, reason: "no paid subscription" };
  }
  if (membership.status === "canceled" || membership.cancelAtPeriodEnd) return { granted: false, reason: "membership ending" };
  if (booking.noShowAt || !booking.groupId) return { granted: false, reason: "not at a table" };

  const mates = await db
    .select({ email: bookings.email })
    .from(bookings)
    .where(
      and(
        eq(bookings.groupId, booking.groupId),
        ne(bookings.id, booking.id),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        isNull(bookings.cancelledLateAt),
        isNull(bookings.noShowAt),
      ),
    );
  const me = normalizeEmail(booking.email);
  const earlier = (await db.execute(sql`
    select distinct lower(trim(tb.email)) as email
    from booking_feedback f
    join bookings fb on fb.id = f.booking_id
    cross join lateral jsonb_array_elements_text(f.want_to_see) w(id)
    join bookings tb on tb.id::text = w.id
    where lower(trim(fb.email)) = ${me} and fb.id <> ${booking.id}`)) as unknown as { email: string }[];
  const pickedNow = Array.isArray(row.wantToSee) ? (row.wantToSee as string[]) : [];
  if (!guaranteeApplies({ pickedNow, mateEmails: mates.map((m) => m.email), likedBefore: new Set(earlier.map((e) => e.email)) })) {
    return { granted: false, reason: "found someone gezellig" };
  }

  // One at a time per membership, so a double submit grants once.
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"guarantee:" + membership.id}))`);
    const since = new Date(Date.now() - ONCE_PER_DAYS * 24 * 3600 * 1000);
    const [already] = await tx
      .select({ id: bookingEvents.id })
      .from(bookingEvents)
      .where(
        and(
          eq(bookingEvents.type, GUARANTEE_EVENT),
          sql`(${bookingEvents.bookingId} = ${booking.id} or (${bookingEvents.payload}->>'membershipId' = ${membership.id} and ${gt(bookingEvents.createdAt, since)}))`,
        ),
      )
      .limit(1);
    if (already) return { granted: false, reason: "already granted" } as const;

    // Next month free: a credit of one month on the customer's balance,
    // which Stripe takes off the next invoice, so nothing is charged.
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(membership.stripeSubscriptionId!);
    const amountCents = sub.items.data.reduce((sum, item) => sum + (item.price.unit_amount ?? 0) * (item.quantity ?? 1), 0);
    if (amountCents <= 0) return { granted: false, reason: "nothing to credit" } as const;
    const credit = await stripe.customers.createBalanceTransaction(
      membership.stripeCustomerId!,
      {
        amount: -amountCents,
        currency: sub.currency ?? "eur",
        description: "Member gezelligheidsgarantie: volgende maand gratis",
        metadata: { bookingId: booking.id, membershipId: membership.id },
      },
      { idempotencyKey: `member-guarantee-${booking.id}` },
    );
    await tx.insert(bookingEvents).values({
      bookingId: booking.id,
      type: GUARANTEE_EVENT,
      payload: { membershipId: membership.id, amountCents, balanceTransactionId: credit.id },
    });
    return { granted: true, amountCents, membershipId: membership.id } as const;
  });
}
