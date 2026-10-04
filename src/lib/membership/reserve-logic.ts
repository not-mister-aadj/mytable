// What the reserve step charges today with the membership. Pure, client-safe.

import { memberBookingAmountCents } from "@/lib/membership/logic";
import { MEMBERSHIP_PLANS, guestSeatCents, type MembershipPlanId } from "@/lib/membership/plans";

export type MemberReserveCharge =
  /** Joining now: the plan's first period (this Sunday included) plus a guest. */
  | { kind: "join"; plan: MembershipPlanId; seats: 1 | 2 }
  /** Already a member: own seat included, a guest at the member price. */
  | { kind: "included"; plan: MembershipPlanId; seats: 1 | 2 };

export function memberReserveTodayCents(c: MemberReserveCharge): number {
  const guest = memberBookingAmountCents(c.seats, guestSeatCents(c.plan));
  return c.kind === "join" ? MEMBERSHIP_PLANS[c.plan].initialCents + guest : guest;
}
