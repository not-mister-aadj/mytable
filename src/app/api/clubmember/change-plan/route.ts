import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import type { Locale } from "@/i18n/config";
import {
  changeClubMembershipPlan,
  getActiveMembershipForUser,
} from "@/lib/club/memberships";
import { isClubPlanIdForSale } from "@/lib/club/plans";
import { getMemberUser } from "@/lib/member-auth";
import { isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 503 },
    );
  }

  const user = await getMemberUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { planId?: string; locale?: string };
  try {
    body = (await request.json()) as { planId?: string; locale?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!isClubPlanIdForSale(body.planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const locale: Locale =
    body.locale === "en" || body.locale === "nl" ? body.locale : "nl";

  const membership = await getActiveMembershipForUser({
    userId: user.id,
    email: user.email,
  });
  if (!membership) {
    return NextResponse.json({ error: "No active membership" }, { status: 400 });
  }

  try {
    const result = await changeClubMembershipPlan({
      membershipId: membership.id,
      planId: body.planId,
      locale,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      planId: result.membership.planId,
      currentPeriodEnd: result.membership.currentPeriodEnd?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[clubmember-change-plan]", err);
    return NextResponse.json({ error: "Plan change failed" }, { status: 500 });
  }
}
