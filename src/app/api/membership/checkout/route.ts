import { NextResponse } from "next/server";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { withRequestClientHints } from "@/lib/analytics/metaCapiContext";
import { isDbConfigured } from "@/db/index";
import { getMemberUser } from "@/lib/member-auth";
import { createMembershipCheckout } from "@/lib/membership/checkout";
import { isMembershipPlanId } from "@/lib/membership/plans";
import { captureClientSafeError } from "@/lib/membership/errors";
import { isEmailFrozen } from "@/lib/customers/freeze";
import { FROZEN_ERROR_CODE, frozenMessage } from "@/lib/customers/freeze-logic";
import { isStripeConfigured } from "@/lib/stripe";

const ERRORS = {
  nl: {
    already_member: "Je bent al lid.",
    table_unavailable: "Deze tafel is niet meer te boeken. Kies een andere zondag.",
    table_full: "Deze tafel is niet meer te boeken. Kies een andere zondag.",
    checkout_failed: "Afrekenen lukte niet. Probeer het nog een keer.",
  },
  en: {
    already_member: "You are already a member.",
    table_unavailable: "This table can no longer be booked. Choose another Sunday.",
    table_full: "This table can no longer be booked. Choose another Sunday.",
    checkout_failed: "Checkout did not work. Please try again.",
  },
} as const;

/**
 * POST /api/membership/checkout: starts a subscription Checkout for the
 * signed-in person. Body { plan, locale, source: "page" | "kies", table?:
 * { eventId, seats, name, dietaryNotes, tableLanguagePreference }, meta }.
 * 401 when signed out (the page then goes through sign up and back).
 */
export async function POST(request: Request) {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const locale = body.locale === "en" ? "en" : "nl";
  // An account on hold (a disputed payment) cannot become a member either.
  if (await isEmailFrozen(user.email)) {
    return NextResponse.json({ error: frozenMessage(locale), code: FROZEN_ERROR_CODE }, { status: 403 });
  }
  if (!isMembershipPlanId(body.plan)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const source = body.source === "kies" ? "kies" : "page";

  const rawTable = body.table && typeof body.table === "object" ? (body.table as Record<string, unknown>) : null;
  const table =
    rawTable && typeof rawTable.eventId === "string" && rawTable.eventId
      ? {
          eventId: rawTable.eventId,
          seats: (Number(rawTable.seats) === 2 ? 2 : 1) as 1 | 2,
          name: typeof rawTable.name === "string" ? rawTable.name.slice(0, 120) : "",
          dietaryNotes: typeof rawTable.dietaryNotes === "string" ? rawTable.dietaryNotes.slice(0, 500) : null,
          tableLanguagePreference:
            typeof rawTable.tableLanguagePreference === "string" ? rawTable.tableLanguagePreference.slice(0, 40) : null,
        }
      : null;

  try {
    const result = await createMembershipCheckout({
      user: { id: user.id, email: user.email },
      plan: body.plan,
      locale,
      source,
      table,
      meta: withRequestClientHints(parseMetaTrackingContext(body.meta), request),
    });
    if (!result.ok) {
      const status = result.error === "already_member" ? 409 : result.error === "checkout_failed" ? 500 : 409;
      return NextResponse.json({ error: ERRORS[locale][result.error], code: result.error }, { status });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    captureClientSafeError(error, "membership_checkout");
    return NextResponse.json({ error: ERRORS[locale].checkout_failed, code: "checkout_failed" }, { status: 500 });
  }
}
