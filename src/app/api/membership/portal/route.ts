import { NextResponse } from "next/server";
import { jouwTafelSettingsPath } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { getMemberUser } from "@/lib/member-auth";
import { getMembershipForUser } from "@/lib/membership/data";
import { captureClientSafeError } from "@/lib/membership/errors";
import { membershipPortalConfigurationId } from "@/lib/membership/stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * POST /api/membership/portal: a Stripe Billing Portal session for the
 * signed-in member (payment method, invoices, cancel at the end of the paid
 * period). Body { locale }. Returns { url }.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { locale?: unknown };
  const locale = body.locale === "en" ? "en" : "nl";

  const membership = await getMembershipForUser(user.id);
  if (!membership?.stripeCustomerId) return NextResponse.json({ error: "No membership" }, { status: 404 });

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: membership.stripeCustomerId,
      configuration: await membershipPortalConfigurationId(),
      locale: locale === "en" ? "en" : "nl",
      return_url: `${getSiteUrl().replace(/\/$/, "")}${jouwTafelSettingsPath(locale)}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    captureClientSafeError(error, "membership_portal");
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}
