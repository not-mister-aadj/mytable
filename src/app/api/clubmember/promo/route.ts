import { NextResponse } from "next/server";
import {
  formatEuroCents,
  previewTrialPromotionCode,
} from "@/lib/club/promotion-codes";
import { getMemberUser } from "@/lib/member-auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.reset < now) {
    rateLimit.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 503 },
    );
  }

  const user = await getMemberUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const promoCode = typeof raw.promoCode === "string" ? raw.promoCode : "";
  const locale = raw.locale === "en" ? "en" : "nl";

  if (!promoCode.trim()) {
    return NextResponse.json(
      { error: "Missing code", errorCode: "promo_invalid" },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const preview = await previewTrialPromotionCode(stripe, promoCode);
    if (!preview) {
      return NextResponse.json(
        { error: "Invalid or expired discount code", errorCode: "promo_invalid" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      code: preview.code,
      amountOffCents: preview.amountOffCents,
      percentOff: preview.percentOff,
      savePercent: `${preview.percentOff}%`,
      originalCents: preview.originalCents,
      finalCents: preview.finalCents,
      amountOffLabel: formatEuroCents(preview.amountOffCents, locale),
      originalLabel: formatEuroCents(preview.originalCents, locale),
      finalLabel: formatEuroCents(preview.finalCents, locale),
    });
  } catch (error) {
    console.error("[clubmember-promo]", error);
    return NextResponse.json({ error: "Promo check failed" }, { status: 500 });
  }
}
