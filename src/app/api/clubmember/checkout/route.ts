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
  isOneTimeMembership,
} from "@/lib/club/memberships";
import { getOrCreateClubPriceId, isClubPlanId, isClubPlanIdForSale, isOneTimeClubPlan } from "@/lib/club/plans";
import { resolveActivePromotionCodeId } from "@/lib/club/promotion-codes";
import { getSiteUrl } from "@/lib/admin-url";
import { getMemberUser } from "@/lib/member-auth";
import {
  canChooseGirlsOnly,
  canStartClubCheckout,
  isActiveOnboardingCity,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { hasOpenReferralAttribution } from "@/lib/referral";
import {
  getStripe,
  getCheckoutPaymentMethodTypes,
  getSubscriptionCheckoutPaymentMethodTypes,
  isStripeConfigured,
} from "@/lib/stripe";
import {
  isSundayTableRsvpOpen,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";
import { sendMetaCapiClubInitiateCheckout } from "@/lib/analytics/metaCapi";
import { splitPersonName } from "@/lib/analytics/metaCapiClient";
import {
  metaContextToStripeMetadata,
  parseMetaTrackingContext,
} from "@/lib/analytics/metaApiContext";
import {
  metaUserDataFromRequest,
  withRequestClientHints,
} from "@/lib/analytics/metaCapiContext";
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
  const promoCodeRaw =
    typeof raw.promoCode === "string" ? raw.promoCode.trim() : "";
  const metaContext = withRequestClientHints(
    parseMetaTrackingContext(
      raw.meta && typeof raw.meta === "object"
        ? (raw.meta as Record<string, unknown>)
        : undefined,
    ),
    request,
  );

  if (!isActiveOnboardingCity(city)) {
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

  const { prefs } = readOnboardingFromMetadata(
    user.user_metadata as Record<string, unknown>,
  );

  if (!canStartClubCheckout(prefs)) {
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

    const requestedPlanId = isClubPlanIdForSale(planId) ? planId : null;
    // Prepaid trial members can upgrade to a recurring plan without waiting for expiry.
    const upgradingOneTime =
      Boolean(active) &&
      active !== null &&
      isOneTimeMembership(active) &&
      requestedPlanId !== null &&
      !isOneTimeClubPlan(requestedPlanId);

    // Existing members keep their plan. New checkouts / one-time upgrades may
    // buy plans that are for sale (1m / 5m / 12m).
    const resolvedPlanId = upgradingOneTime
      ? requestedPlanId
      : active
        ? isClubPlanId(active.planId)
          ? active.planId
          : null
        : requestedPlanId;

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
    if (active && !upgradingOneTime) {
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

    // Promo codes only apply to the one-time trial (1m).
    let trialPromotionCodeId: string | null = null;
    if (promoCodeRaw) {
      if (resolvedPlanId !== "1m") {
        return NextResponse.json(
          {
            error: "Discount codes only apply to the 1 month trial",
            errorCode: "promo_trial_only",
          },
          { status: 400 },
        );
      }
      trialPromotionCodeId = await resolveActivePromotionCodeId(
        stripe,
        promoCodeRaw,
      );
      if (!trialPromotionCodeId) {
        return NextResponse.json(
          {
            error: "Invalid or expired discount code",
            errorCode: "promo_invalid",
          },
          { status: 400 },
        );
      }
    }

    // Stripe Checkout allows at most one discount. Trial promo wins over referral.
    const discountParams = trialPromotionCodeId
      ? { discounts: [{ promotion_code: trialPromotionCodeId }] }
      : friendReferral && referralCoupon
        ? { discounts: [{ coupon: referralCoupon }] }
        : {};

    const oneTime = isOneTimeClubPlan(resolvedPlanId);
    const sharedMetadata = {
      mytable_kind: "club_membership",
      membership_id: membershipId,
      signup_id: signupId,
      plan_id: resolvedPlanId,
      user_id: user.id,
      city,
      table_date: tableDate,
      table_type: tableType,
      locale,
      referral_friend: friendReferral && !trialPromotionCodeId ? "1" : "0",
      promo_code: trialPromotionCodeId ? promoCodeRaw.toUpperCase() : "",
      ...metaContextToStripeMetadata(metaContext),
    };

    const session = oneTime
      ? await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: user.email,
          locale: locale === "nl" ? "nl" : "en",
          payment_method_types: getCheckoutPaymentMethodTypes("EUR"),
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${siteUrl}${clubmemberConfirmedPath(locale)}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}${clubmemberCancelledPath(locale)}?session_id={CHECKOUT_SESSION_ID}`,
          client_reference_id: membershipId,
          ...discountParams,
          metadata: sharedMetadata,
        })
      : await stripe.checkout.sessions.create({
          // iDEAL for first invoice + SEPA for renewals
          mode: "subscription",
          customer_email: user.email,
          locale: locale === "nl" ? "nl" : "en",
          payment_method_types: getSubscriptionCheckoutPaymentMethodTypes("EUR"),
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${siteUrl}${clubmemberConfirmedPath(locale)}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}${clubmemberCancelledPath(locale)}?session_id={CHECKOUT_SESSION_ID}`,
          client_reference_id: membershipId,
          ...discountParams,
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
              referral_friend: friendReferral && !trialPromotionCodeId ? "1" : "0",
            },
          },
          metadata: sharedMetadata,
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

    const nameParts = splitPersonName(name);
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
        nameParts.firstName,
        {
          lastName: nameParts.lastName,
          city,
          country: "nl",
          externalId: user.id,
        },
      ),
    });

    void captureServerEvent(user.email, PostHogEvents.checkoutStarted, {
      product: "clubmember",
      plan_id: resolvedPlanId,
      city,
      table_type: tableType,
      membership_id: membershipId,
      signup_id: signupId,
      stripe_session_id: session.id,
      language: locale,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      membershipId,
      signupId,
    });
  } catch (error) {
    console.error("[clubmember-checkout]", error);
    const { captureCriticalError } = await import("@/lib/sentry/critical");
    captureCriticalError(error, {
      flow: "payment",
      step: "clubmember_checkout",
    });
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
