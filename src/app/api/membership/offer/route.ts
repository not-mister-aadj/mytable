import { NextResponse } from "next/server";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { withRequestClientHints } from "@/lib/analytics/metaCapiContext";
import { FROZEN_ERROR_CODE, frozenMessage } from "@/lib/customers/freeze-logic";
import { captureClientSafeError } from "@/lib/membership/errors";
import { startMembershipOfferCheckout } from "@/lib/membership/offer";

const ERRORS = {
  nl: {
    already_member: "Je bent al lid.",
    offer_closed: "Dit aanbod is verlopen.",
    generic: "Afrekenen lukte niet. Probeer het nog een keer.",
  },
  en: {
    already_member: "You are already a member.",
    offer_closed: "This offer has ended.",
    generic: "Checkout did not work. Please try again.",
  },
} as const;

/**
 * POST /api/membership/offer: "yes" on the offer between paying for a
 * Sunday Social and its confirmation. Body { sessionId, locale, meta }: the
 * Checkout session of the booking just paid. No sign-in: the membership is
 * for the address of that booking, and the caller pays for it on Stripe.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const locale = body.locale === "en" ? "en" : "nl";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 200) : "";
  if (!sessionId) return NextResponse.json({ error: ERRORS[locale].offer_closed, code: "offer_closed" }, { status: 400 });

  try {
    const result = await startMembershipOfferCheckout({
      sessionId,
      locale,
      meta: withRequestClientHints(parseMetaTrackingContext(body.meta), request),
    });
    if (result.ok) return NextResponse.json({ url: result.url });
    if (result.error === "frozen") {
      return NextResponse.json({ error: frozenMessage(locale), code: FROZEN_ERROR_CODE }, { status: 403 });
    }
    if (result.error === "already_member" || result.error === "offer_closed") {
      return NextResponse.json({ error: ERRORS[locale][result.error], code: result.error }, { status: 409 });
    }
    return NextResponse.json({ error: ERRORS[locale].generic, code: result.error }, { status: 500 });
  } catch (error) {
    captureClientSafeError(error, "membership_offer_checkout");
    return NextResponse.json({ error: ERRORS[locale].generic, code: "checkout_failed" }, { status: 500 });
  }
}
