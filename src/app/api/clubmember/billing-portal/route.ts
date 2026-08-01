import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { clubmemberPath, type Locale } from "@/i18n/config";
import { getActiveMembershipForUser } from "@/lib/club/memberships";
import { getSiteUrl } from "@/lib/env";
import { getMemberUser } from "@/lib/member-auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

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

  let locale: Locale = "nl";
  try {
    const body = (await request.json()) as {
      locale?: string;
      intent?: string;
    };
    if (body.locale === "en" || body.locale === "nl") locale = body.locale;
  } catch {
    // optional body
  }

  const membership = await getActiveMembershipForUser({
    userId: user.id,
    email: user.email,
  });

  if (!membership?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer on membership" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const siteUrl = getSiteUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: membership.stripeCustomerId,
    return_url: `${siteUrl}${clubmemberPath(locale)}`,
  });
  return NextResponse.json({ url: session.url });
}
