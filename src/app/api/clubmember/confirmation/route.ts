import { NextResponse } from "next/server";
import type { Locale } from "@/i18n/config";
import { getClubConfirmationPurchase } from "@/lib/analytics/clubConfirmationPurchase";
import { sendMetaCapiClubPurchaseForSession } from "@/lib/analytics/metaCapi";
import { fulfillClubCheckoutSession } from "@/lib/club/memberships";
import { isDbConfigured } from "@/db/index";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function GET(request: Request) {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ purchase: null }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id")?.trim();
  const locale = (searchParams.get("locale") === "en" ? "en" : "nl") as Locale;

  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "Ongeldige sessie." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    await fulfillClubCheckoutSession(session);
  } catch (err) {
    console.error("[clubmember confirmation] fulfill", err);
  }

  const purchase = await getClubConfirmationPurchase(sessionId, locale);

  if (purchase?.membershipId) {
    void sendMetaCapiClubPurchaseForSession(sessionId, request.headers);
  }

  return NextResponse.json({ purchase });
}
