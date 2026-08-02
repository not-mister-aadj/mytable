import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import type { SundayTableSignupProfile } from "@/db/schema";
import {
  clubmemberCancelledPath,
  clubmemberConfirmedPath,
  type Locale,
} from "@/i18n/config";
import {
  attachCheckoutSession,
  createPendingClubCheckout,
  getActiveMembershipForUser,
} from "@/lib/club/memberships";
import { getOrCreateClubPriceId, isClubPlanId, isClubPlanIdForSale } from "@/lib/club/plans";
import { getSiteUrl } from "@/lib/admin-url";
import { getMemberUser } from "@/lib/member-auth";
import {
  canChooseGirlsOnly,
  isSundayTableOnboardingReady,
  ONBOARDING_CITIES,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { hasOpenReferralAttribution } from "@/lib/referral";
import {
  getStripe,
  getSubscriptionCheckoutPaymentMethodTypes,
  isStripeConfigured,
} from "@/lib/stripe";
import {
  isSundayTableRsvpOpen,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";
import { sendMetaCapiClubInitiateCheckout } from "@/lib/analytics/metaCapi";
import { metaUserDataFromRequest } from "@/lib/analytics/metaCapiContext";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { PostHogEvents } from "@/lib/posthog/events";
import { captureServerEvent } from "@/lib/posthog/server";

const TABLE_TYPES = new Set(["girls_only", "mixed"]);

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 8, windowMs = 60_000): boolean {
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

/** In local dev, return to the host the browser actually used (3000 vs 3001). */
function resolveCheckoutReturnOrigin(request: Request): string {
  if (process.env.NODE_ENV === "development") {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }
  return getSiteUrl().replace(/\/$/, "");
}

function profileFromPrefs(
  prefs: ReturnType<typeof readOnboardingFromMetadata>["prefs"],
): SundayTableSignupProfile {
  return {
    gender: prefs.gender,
    personality: prefs.personality,
    birthDate: prefs.birthDate,
    joinIntent: prefs.joinIntent,
    company: prefs.company,
    cities: prefs.cities,
    cityFlexible: prefs.cityFlexible,
    preferredTableType: prefs.tableType,
    interests: prefs.interests,
  };
}

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

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const city = typeof raw.city === "string" ? raw.city.trim() : "";
  const tableDate =
    typeof raw.tableDate === "string" ? raw.tableDate.trim() : "";
  const tableType =
    typeof raw.tableType === "string" ? raw.tableType.trim() : "";
  const planId = raw.planId;
  const locale: Locale =
    raw.locale === "en" || raw.locale === "nl" ? raw.locale : "nl";
  const metaContext = parseMetaTrackingContext(
    raw.meta && typeof raw.meta === "object"
      ? (raw.meta as Record<string, unknown>)
      : undefined,
  );

  if (!(ONBOARDING_CITIES as readonly string[]).includes(city)) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!TABLE_TYPES.has(tableType)) {
    return NextResponse.json({ error: "Invalid table type" }, { status: 400 });
  }

  const tableSunday = parseAmsterdamDateIso(tableDate);
  if (!tableSunday || !isSundayTableRsvpOpen(tableSunday)) {
    return NextResponse.json({ error: "Signup closed" }, { status: 403 });
  }

  const { completed, prefs } = readOnboardingFromMetadata(
    user.user_metadata as Record<string, unknown>,
  );

  if (!isSundayTableOnboardingReady(completed, prefs)) {
    return NextResponse.json(
      { error: "Onboarding required" },
      { status: 403 },
    );
  }

  if (tableType === "girls_only" && !canChooseGirlsOnly(prefs.gender)) {
    return NextResponse.json({ error: "Girls only" }, { status: 403 });
  }

  const name =
    prefs.name.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null);

  try {
    const active = await getActiveMembershipForUser({
      userId: user.id,
      email: user.email,
    });

    // Existing members keep their plan. New checkouts may only buy
    // plans that are for sale (1m / 5m / 12m).
    const resolvedPlanId = active
      ? isClubPlanId(active.planId)
        ? active.planId
        : null
      : isClubPlanIdForSale(planId)
        ? planId
        : null;

    if (!resolvedPlanId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { membershipId, signupId, newlyConfirmed } =
      await createPendingClubCheckout({
      email: user.email,
      name,
      userId: user.id,
      planId: resolvedPlanId,
      locale,
      city,
      tableDate,
      tableType: tableType as "girls_only" | "mixed",
      profile: profileFromPrefs(prefs),
    });

    // Already a paying member: confirm RSVP without another checkout
    if (active) {
      if (newlyConfirmed) {
        const { getDb } = await import("@/db/index");
        const { sundayTableSignups } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");
        const { voidSundayTableConfirmationEmail } = await import(
          "@/lib/email/sendSundayTableBookingEmails"
        );
        const db = getDb();
        const [signup] = await db
          .select()
          .from(sundayTableSignups)
          .where(eq(sundayTableSignups.id, signupId))
          .limit(1);
        if (signup) voidSundayTableConfirmationEmail(signup);
      }
      void captureServerEvent(user.email, PostHogEvents.sundayRsvp, {
        city,
        table_type: tableType,
        signup_id: signupId,
      });
      return NextResponse.json({
        ok: true,
        alreadyMember: true,
        membershipId,
        signupId,
      });
    }

    const stripe = getStripe();
    const priceId = await getOrCreateClubPriceId(resolvedPlanId, locale);
    const siteUrl = resolveCheckoutReturnOrigin(request);
    const referralCoupon = process.env.STRIPE_REFERRAL_FRIEND_COUPON_ID?.trim();
    const friendReferral =
      Boolean(referralCoupon) &&
      (await hasOpenReferralAttribution(user.email));

    // iDEAL for first invoice + SEPA for renewals (Dashboard must enable SEPA / iDEAL recurring).
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      locale: locale === "nl" ? "nl" : "en",
      payment_method_types: getSubscriptionCheckoutPaymentMethodTypes("EUR"),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}${clubmemberConfirmedPath(locale)}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${clubmemberCancelledPath(locale)}?session_id={CHECKOUT_SESSION_ID}`,
      client_reference_id: membershipId,
      ...(friendReferral && referralCoupon
        ? { discounts: [{ coupon: referralCoupon }] }
        : {}),
      subscription_data: {
        metadata: {
          mytable_kind: "club_membership",
          membership_id: membershipId,
          signup_id: signupId,
          plan_id: resolvedPlanId,
          user_id: user.id,
          city,
          table_date: tableDate,
          table_type: tableType,
          referral_friend: friendReferral ? "1" : "0",
        },
      },
      metadata: {
        mytable_kind: "club_membership",
        membership_id: membershipId,
        signup_id: signupId,
        plan_id: resolvedPlanId,
        user_id: user.id,
        city,
        table_date: tableDate,
        table_type: tableType,
        locale,
        referral_friend: friendReferral ? "1" : "0",
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session missing URL" },
        { status: 500 },
      );
    }

    await attachCheckoutSession({
      membershipId,
      signupId,
      sessionId: session.id,
    });

    void sendMetaCapiClubInitiateCheckout({
      membershipId,
      planId: resolvedPlanId,
      email: user.email,
      name,
      city,
      locale,
      userData: metaUserDataFromRequest(
        request,
        metaContext,
        user.email,
        name?.split(/\s+/)[0] ?? null,
      ),
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      membershipId,
      signupId,
    });
  } catch (error) {
    console.error("[clubmember-checkout]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
