// Membership rules: pure, client-safe and unit tested
// (npx tsx --test src/lib/membership/*.test.ts). No db, Stripe or browser
// imports here.

import { hasInitialTerm, isMembershipPlanId, type MembershipPlanId } from "@/lib/membership/plans";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Members book this long before everyone else. */
export const EARLY_ACCESS_HOURS = 48;

/** A member can cancel their own (included) seat until this long before
 * the start. Founder's decision: 48 hours. */
export const MEMBER_SEAT_CANCEL_HOURS = 48;

/** The reminder before the first period ends goes out this many days ahead. */
export const REMINDER_DAYS_BEFORE = 7;

export type MembershipStatus = "active" | "past_due" | "canceled";

/** What the booking and settings code needs to know about a membership. */
export type MembershipSnapshot = {
  plan: MembershipPlanId;
  status: MembershipStatus;
  currentPeriodEnd: Date | null;
  initialPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  bookingBlockedUntil: Date | null;
  noShowCount: number;
  reminderSentAt: Date | null;
};

export function isMembershipStatus(value: unknown): value is MembershipStatus {
  return value === "active" || value === "past_due" || value === "canceled";
}

/**
 * Stripe's subscription status onto ours. "trialing" never happens (no
 * trials) but counts as active; "incomplete" (first payment still open) is
 * not a membership yet.
 */
export function membershipStatusFromStripe(status: string): MembershipStatus | null {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return null;
  }
}

/** A membership that is paid up and has not ended. */
export function isActiveMember(m: MembershipSnapshot | null, now: number = Date.now()): m is MembershipSnapshot {
  if (!m || m.status !== "active") return false;
  // Stripe moves an ended subscription to "canceled"; until that webhook
  // lands, a cancelled membership past its end is not active either.
  if (m.cancelAtPeriodEnd && m.currentPeriodEnd && m.currentPeriodEnd.getTime() <= now) return false;
  return true;
}

// ---------------------------------------------------------------- early access

/** Default "members only until" for a table that opens now. */
export function defaultMembersOnlyUntil(openedAt: Date): Date {
  return new Date(openedAt.getTime() + EARLY_ACCESS_HOURS * HOUR_MS);
}

/** True while only members can book this table. */
export function isMembersOnly(membersOnlyUntil: Date | string | null | undefined, now: number = Date.now()): boolean {
  if (!membersOnlyUntil) return false;
  const until = typeof membersOnlyUntil === "string" ? Date.parse(membersOnlyUntil) : membersOnlyUntil.getTime();
  return Number.isFinite(until) && now < until;
}

// ---------------------------------------------------------------- booking

export type MemberBookingDecision =
  /** Not a member (or not anymore): books and pays like everyone else. */
  | { kind: "non_member" }
  /** The seat is included; a guest pays the member price. */
  | { kind: "included" }
  /** Member, but booking is paused after a no-show. */
  | { kind: "blocked"; until: Date }
  /** Member whose payment failed: update payment details first. */
  | { kind: "past_due" };

/**
 * How a booking for a table starting at `eventStartsAt` works for this
 * person. A member whose membership ends before the table (cancelled) books
 * it as a non-member.
 */
export function memberBookingDecision(
  m: MembershipSnapshot | null,
  eventStartsAt: Date,
  now: number = Date.now(),
): MemberBookingDecision {
  if (!m) return { kind: "non_member" };
  if (m.status === "past_due") return { kind: "past_due" };
  if (!isActiveMember(m, now)) return { kind: "non_member" };
  if (m.cancelAtPeriodEnd && m.currentPeriodEnd && eventStartsAt.getTime() > m.currentPeriodEnd.getTime()) {
    return { kind: "non_member" };
  }
  if (m.bookingBlockedUntil && m.bookingBlockedUntil.getTime() > now) {
    return { kind: "blocked", until: m.bookingBlockedUntil };
  }
  return { kind: "included" };
}

/**
 * Who may book a table right now. During the early-access window only
 * members (whose seat is included) may; everyone else waits.
 */
export function earlyAccessAllows(decision: MemberBookingDecision, membersOnlyUntil: Date | null, now: number = Date.now()): boolean {
  if (!isMembersOnly(membersOnlyUntil, now)) return true;
  return decision.kind === "included";
}

/** Price of a booking for a member: own seat free, a guest at `guestCents`. */
export function memberBookingAmountCents(seats: number, guestCents: number): number {
  return Math.max(0, seats - 1) * guestCents;
}

// ---------------------------------------------------------------- cancel seat

/** Whether a member can still cancel their own seat for a table. */
export function canMemberCancelSeat(eventStartsAt: Date, now: number = Date.now()): boolean {
  return eventStartsAt.getTime() - now >= MEMBER_SEAT_CANCEL_HOURS * HOUR_MS;
}

// ---------------------------------------------------------------- no-shows

/** One calendar month later (31 Jan + 1 month = 28/29 Feb). */
export function addOneMonth(date: Date): Date {
  const out = new Date(date.getTime());
  const day = out.getUTCDate();
  out.setUTCDate(1);
  out.setUTCMonth(out.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(day, lastDay));
  return out;
}

export type NoShowOutcome =
  /** First no-show: a friendly warning, nothing else. */
  | { kind: "warning"; noShowCount: number }
  /** Any later no-show: no booking for a month, the membership continues. */
  | { kind: "block"; noShowCount: number; blockedUntil: Date };

/** What a newly recorded no-show leads to, given the count before it. */
export function noShowOutcome(previousCount: number, now: Date = new Date()): NoShowOutcome {
  const noShowCount = Math.max(0, previousCount) + 1;
  if (noShowCount === 1) return { kind: "warning", noShowCount };
  return { kind: "block", noShowCount, blockedUntil: addOneMonth(now) };
}

// ---------------------------------------------------------------- reminder

export type ReminderCandidate = {
  id: string;
  plan: string;
  status: string;
  initialPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  reminderSentAt: Date | null;
};

/**
 * Memberships that get "Je lidmaatschap loopt vanaf {datum} per maand door"
 * now: a plan with a first period (4m, 12m), active, not cancelling, not
 * reminded yet, and the first period ends within REMINDER_DAYS_BEFORE days
 * (but has not ended yet).
 */
export function needsRenewalReminder(m: ReminderCandidate, now: number = Date.now()): boolean {
  if (!isMembershipPlanId(m.plan) || !hasInitialTerm(m.plan)) return false;
  if (m.status !== "active" || m.cancelAtPeriodEnd || m.reminderSentAt) return false;
  if (!m.initialPeriodEnd) return false;
  const end = m.initialPeriodEnd.getTime();
  return end > now && end - now <= REMINDER_DAYS_BEFORE * DAY_MS;
}

export function selectRenewalReminders<T extends ReminderCandidate>(rows: readonly T[], now: number = Date.now()): T[] {
  return rows.filter((m) => needsRenewalReminder(m, now));
}

// ---------------------------------------------------------------- settings

export type MembershipSummary =
  | { kind: "renews"; date: Date; cents: number }
  | { kind: "ends"; date: Date }
  | { kind: "past_due" }
  | { kind: "none" };

/** The line under the plan in settings. */
export function membershipSummary(m: MembershipSnapshot | null, nextCents: number, now: number = Date.now()): MembershipSummary {
  if (!m || m.status === "canceled") return { kind: "none" };
  if (m.status === "past_due") return { kind: "past_due" };
  if (!m.currentPeriodEnd) return { kind: "none" };
  if (m.cancelAtPeriodEnd) return m.currentPeriodEnd.getTime() > now ? { kind: "ends", date: m.currentPeriodEnd } : { kind: "none" };
  return { kind: "renews", date: m.currentPeriodEnd, cents: nextCents };
}

// ---------------------------------------------------------------- client

/** A membership as the browser gets it (dates as ISO strings). */
export type ClientMembership = {
  plan: MembershipPlanId;
  status: MembershipStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  bookingBlockedUntil: string | null;
};

export function toClientMembership(m: MembershipSnapshot | null): ClientMembership | null {
  if (!m || m.status === "canceled") return null;
  return {
    plan: m.plan,
    status: m.status,
    currentPeriodEnd: m.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: m.cancelAtPeriodEnd,
    bookingBlockedUntil: m.bookingBlockedUntil?.toISOString() ?? null,
  };
}

export function fromClientMembership(m: ClientMembership | null): MembershipSnapshot | null {
  if (!m) return null;
  return {
    plan: m.plan,
    status: m.status,
    currentPeriodEnd: m.currentPeriodEnd ? new Date(m.currentPeriodEnd) : null,
    initialPeriodEnd: null,
    cancelAtPeriodEnd: m.cancelAtPeriodEnd,
    bookingBlockedUntil: m.bookingBlockedUntil ? new Date(m.bookingBlockedUntil) : null,
    noShowCount: 0,
    reminderSentAt: null,
  };
}
