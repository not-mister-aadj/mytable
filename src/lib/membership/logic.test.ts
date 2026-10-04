// Run with: npx tsx --test src/lib/membership/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addOneMonth,
  canMemberCancelSeat,
  defaultMembersOnlyUntil,
  earlyAccessAllows,
  isActiveMember,
  isMembersOnly,
  memberBookingAmountCents,
  memberBookingDecision,
  membershipStatusFromStripe,
  membershipSummary,
  needsRenewalReminder,
  noShowOutcome,
  selectRenewalReminders,
  type MembershipSnapshot,
  type ReminderCandidate,
} from "./logic";
import {
  DEFAULT_MEMBERSHIP_PLAN,
  MEMBERSHIP_PLANS,
  formatPlanEuros,
  guestSeatCents,
  hasInitialTerm,
  isMembershipPlanId,
  lowestMonthlyCents,
  nextChargeCents,
  savingsExample,
} from "./plans";

const NOW = Date.parse("2026-10-04T10:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function member(partial: Partial<MembershipSnapshot> = {}): MembershipSnapshot {
  return {
    plan: "4m",
    status: "active",
    currentPeriodEnd: new Date(NOW + 60 * DAY),
    initialPeriodEnd: new Date(NOW + 60 * DAY),
    cancelAtPeriodEnd: false,
    bookingBlockedUntil: null,
    noShowCount: 0,
    reminderSentAt: null,
    ...partial,
  };
}

// ---------------------------------------------------------------- plans

test("plan prices match the approved design", () => {
  assert.deepEqual(
    [MEMBERSHIP_PLANS["1m"].initialCents, MEMBERSHIP_PLANS["1m"].monthlyCents, MEMBERSHIP_PLANS["1m"].initialMonths],
    [1299, 1299, 1],
  );
  assert.deepEqual(
    [MEMBERSHIP_PLANS["4m"].initialCents, MEMBERSHIP_PLANS["4m"].monthlyCents, MEMBERSHIP_PLANS["4m"].initialMonths],
    [3600, 900, 4],
  );
  assert.deepEqual(
    [MEMBERSHIP_PLANS["12m"].initialCents, MEMBERSHIP_PLANS["12m"].monthlyCents, MEMBERSHIP_PLANS["12m"].initialMonths],
    [9900, 825, 12],
  );
  assert.equal(DEFAULT_MEMBERSHIP_PLAN, "4m");
  assert.equal(MEMBERSHIP_PLANS["4m"].badge, "popular");
  assert.equal(MEMBERSHIP_PLANS["12m"].badge, "best_value");
  assert.equal(lowestMonthlyCents(), 825);
});

test("guest price per plan is the plan's monthly amount", () => {
  assert.equal(guestSeatCents("1m"), 1299);
  assert.equal(guestSeatCents("4m"), 900);
  assert.equal(guestSeatCents("12m"), 825);
});

test("next charge is always the monthly amount", () => {
  assert.equal(nextChargeCents("1m"), 1299);
  assert.equal(nextChargeCents("4m"), 900);
  assert.equal(nextChargeCents("12m"), 825);
});

test("only 4m and 12m have a first term (schedule, reminder)", () => {
  assert.equal(hasInitialTerm("1m"), false);
  assert.equal(hasInitialTerm("4m"), true);
  assert.equal(hasInitialTerm("12m"), true);
});

test("plan ids are validated", () => {
  assert.equal(isMembershipPlanId("4m"), true);
  assert.equal(isMembershipPlanId("3m"), false);
  assert.equal(isMembershipPlanId(undefined), false);
});

test("member booking amount: own seat free, guest at member price", () => {
  assert.equal(memberBookingAmountCents(1, 900), 0);
  assert.equal(memberBookingAmountCents(2, 900), 900);
  assert.equal(memberBookingAmountCents(2, 825), 825);
  assert.equal(memberBookingAmountCents(2, 1299), 1299);
});

test("savings example is computed from the single price", () => {
  assert.deepEqual(savingsExample(1500), { sundays: 4, singleTotalCents: 6000, memberCents: 3600 });
  assert.equal(savingsExample(null), null);
  // Never show an example where the membership is not cheaper.
  assert.equal(savingsExample(800), null);
});

test("euros are formatted per locale", () => {
  assert.equal(formatPlanEuros(1299, "nl"), "12,99");
  assert.equal(formatPlanEuros(1299, "en"), "12.99");
  assert.equal(formatPlanEuros(900, "nl"), "9");
  assert.equal(formatPlanEuros(825, "nl"), "8,25");
});

// ---------------------------------------------------------------- status

test("Stripe statuses map onto ours", () => {
  assert.equal(membershipStatusFromStripe("active"), "active");
  assert.equal(membershipStatusFromStripe("trialing"), "active");
  assert.equal(membershipStatusFromStripe("past_due"), "past_due");
  assert.equal(membershipStatusFromStripe("unpaid"), "past_due");
  assert.equal(membershipStatusFromStripe("canceled"), "canceled");
  assert.equal(membershipStatusFromStripe("incomplete"), null);
});

test("a cancelled membership past its end is not active", () => {
  assert.equal(isActiveMember(member(), NOW), true);
  assert.equal(isActiveMember(member({ cancelAtPeriodEnd: true, currentPeriodEnd: new Date(NOW - HOUR) }), NOW), false);
  assert.equal(isActiveMember(member({ cancelAtPeriodEnd: true, currentPeriodEnd: new Date(NOW + HOUR) }), NOW), true);
  assert.equal(isActiveMember(member({ status: "canceled" }), NOW), false);
  assert.equal(isActiveMember(null, NOW), false);
});

// ---------------------------------------------------------------- early access

test("early access window: members only until the set moment", () => {
  const until = defaultMembersOnlyUntil(new Date(NOW));
  assert.equal(until.getTime(), NOW + 48 * HOUR);
  assert.equal(isMembersOnly(until, NOW), true);
  assert.equal(isMembersOnly(until, NOW + 48 * HOUR - 1), true);
  assert.equal(isMembersOnly(until, NOW + 48 * HOUR), false);
  assert.equal(isMembersOnly(null, NOW), false);
  assert.equal(isMembersOnly(until.toISOString(), NOW), true);
});

test("early access: only included members book during the window", () => {
  const until = new Date(NOW + 10 * HOUR);
  const starts = new Date(NOW + 20 * DAY);
  assert.equal(earlyAccessAllows(memberBookingDecision(member(), starts, NOW), until, NOW), true);
  assert.equal(earlyAccessAllows(memberBookingDecision(null, starts, NOW), until, NOW), false);
  // A blocked member waits like everyone else.
  const blocked = member({ bookingBlockedUntil: new Date(NOW + 5 * DAY) });
  assert.equal(earlyAccessAllows(memberBookingDecision(blocked, starts, NOW), until, NOW), false);
  // After the window everyone books.
  assert.equal(earlyAccessAllows(memberBookingDecision(null, starts, NOW), until, NOW + 11 * HOUR), true);
  assert.equal(earlyAccessAllows({ kind: "non_member" }, null, NOW), true);
});

test("booking decision for members", () => {
  const starts = new Date(NOW + 10 * DAY);
  assert.deepEqual(memberBookingDecision(null, starts, NOW), { kind: "non_member" });
  assert.deepEqual(memberBookingDecision(member(), starts, NOW), { kind: "included" });
  assert.deepEqual(memberBookingDecision(member({ status: "past_due" }), starts, NOW), { kind: "past_due" });
  assert.deepEqual(memberBookingDecision(member({ status: "canceled" }), starts, NOW), { kind: "non_member" });
  const blockedUntil = new Date(NOW + 3 * DAY);
  assert.deepEqual(memberBookingDecision(member({ bookingBlockedUntil: blockedUntil }), starts, NOW), {
    kind: "blocked",
    until: blockedUntil,
  });
  // A block that has passed no longer applies.
  assert.deepEqual(memberBookingDecision(member({ bookingBlockedUntil: new Date(NOW - DAY) }), starts, NOW), { kind: "included" });
  // Cancelled: tables after the end are not included any more.
  const cancelling = member({ cancelAtPeriodEnd: true, currentPeriodEnd: new Date(NOW + 5 * DAY) });
  assert.deepEqual(memberBookingDecision(cancelling, new Date(NOW + 4 * DAY), NOW), { kind: "included" });
  assert.deepEqual(memberBookingDecision(cancelling, new Date(NOW + 6 * DAY), NOW), { kind: "non_member" });
});

// ---------------------------------------------------------------- cancel seat

test("members cancel their own seat until 48 hours before the start", () => {
  const starts = new Date(NOW + 72 * HOUR);
  assert.equal(canMemberCancelSeat(starts, NOW), true);
  assert.equal(canMemberCancelSeat(starts, NOW + 24 * HOUR), true); // exactly 48h before
  assert.equal(canMemberCancelSeat(starts, NOW + 24 * HOUR + 1), false);
  assert.equal(canMemberCancelSeat(starts, NOW + 30 * HOUR), false);
  assert.equal(canMemberCancelSeat(starts, NOW + 80 * HOUR), false);
});

// ---------------------------------------------------------------- no-shows

test("first no-show is a warning, every later one a month without booking", () => {
  const now = new Date("2026-10-04T10:00:00Z");
  assert.deepEqual(noShowOutcome(0, now), { kind: "warning", noShowCount: 1 });
  assert.deepEqual(noShowOutcome(1, now), {
    kind: "block",
    noShowCount: 2,
    blockedUntil: new Date("2026-11-04T10:00:00Z"),
  });
  const third = noShowOutcome(2, now);
  assert.equal(third.kind, "block");
  assert.equal(third.noShowCount, 3);
});

test("one month later keeps the day, or the month's last day", () => {
  assert.equal(addOneMonth(new Date("2026-01-31T09:00:00Z")).toISOString(), "2026-02-28T09:00:00.000Z");
  assert.equal(addOneMonth(new Date("2028-01-31T09:00:00Z")).toISOString(), "2028-02-29T09:00:00.000Z");
  assert.equal(addOneMonth(new Date("2026-12-15T09:00:00Z")).toISOString(), "2027-01-15T09:00:00.000Z");
});

// ---------------------------------------------------------------- reminder

function candidate(partial: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    id: "m1",
    plan: "4m",
    status: "active",
    initialPeriodEnd: new Date(NOW + 6 * DAY),
    cancelAtPeriodEnd: false,
    reminderSentAt: null,
    ...partial,
  };
}

test("reminder goes out within 7 days before the first period ends", () => {
  assert.equal(needsRenewalReminder(candidate(), NOW), true);
  assert.equal(needsRenewalReminder(candidate({ initialPeriodEnd: new Date(NOW + 7 * DAY) }), NOW), true);
  assert.equal(needsRenewalReminder(candidate({ initialPeriodEnd: new Date(NOW + 8 * DAY) }), NOW), false);
  assert.equal(needsRenewalReminder(candidate({ initialPeriodEnd: new Date(NOW - HOUR) }), NOW), false);
});

test("reminder: only 4m and 12m, active, not cancelling, not sent before", () => {
  assert.equal(needsRenewalReminder(candidate({ plan: "12m" }), NOW), true);
  assert.equal(needsRenewalReminder(candidate({ plan: "1m" }), NOW), false);
  assert.equal(needsRenewalReminder(candidate({ status: "past_due" }), NOW), false);
  assert.equal(needsRenewalReminder(candidate({ cancelAtPeriodEnd: true }), NOW), false);
  assert.equal(needsRenewalReminder(candidate({ reminderSentAt: new Date(NOW - DAY) }), NOW), false);
  assert.equal(needsRenewalReminder(candidate({ initialPeriodEnd: null }), NOW), false);
  const rows = [candidate({ id: "a" }), candidate({ id: "b", plan: "1m" }), candidate({ id: "c", plan: "12m" })];
  assert.deepEqual(selectRenewalReminders(rows, NOW).map((r) => r.id), ["a", "c"]);
});

// ---------------------------------------------------------------- settings

test("settings line: next payment, end date or payment problem", () => {
  const end = new Date(NOW + 20 * DAY);
  assert.deepEqual(membershipSummary(member({ currentPeriodEnd: end }), 900, NOW), { kind: "renews", date: end, cents: 900 });
  assert.deepEqual(membershipSummary(member({ currentPeriodEnd: end, cancelAtPeriodEnd: true }), 900, NOW), { kind: "ends", date: end });
  assert.deepEqual(membershipSummary(member({ status: "past_due" }), 900, NOW), { kind: "past_due" });
  assert.deepEqual(membershipSummary(null, 900, NOW), { kind: "none" });
});
