import { NextResponse } from "next/server";
import type { Locale } from "@/i18n/config";
import { sendMetaCapiPurchaseForSession } from "@/lib/analytics/metaCapi";
import { getBookingConfirmationStatus } from "@/lib/booking-outcome-data";
import { isDbConfigured } from "@/db/index";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET(request: Request) {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ summary: null, pending: false }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id")?.trim();
  const locale = (searchParams.get("locale") === "en" ? "en" : "nl") as Locale;

  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "Ongeldige sessie." }, { status: 400 });
  }

  const status = await getBookingConfirmationStatus(sessionId, locale);

  if (status.summary?.bookingId) {
    void sendMetaCapiPurchaseForSession(sessionId, request.headers);
  }

  return NextResponse.json(status);
}
