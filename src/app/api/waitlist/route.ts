import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import {
  claimWaitlistWelcomeEmail,
  createWaitlistSignup,
  releaseWaitlistWelcomeEmailClaim,
} from "@/lib/waitlist-data";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import { sendSundayTableWaitlistWelcomeEmail } from "@/lib/email/sendSundayTableWaitlistEmails";
import { sendMetaCapiLead } from "@/lib/analytics/metaCapi";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { metaUserDataFromRequest } from "@/lib/analytics/metaCapiContext";
import type { Locale } from "@/i18n/config";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";
import { getSiteUrl } from "@/lib/env";

const TICKET_PRICE_IDS = new Set([
  "under_5",
  "5_10",
  "10_15",
  "15_20",
  "20_plus",
]);

const ALL_INCLUSIVE_PRICE_IDS = new Set([
  "under_25",
  "25_40",
  "40_60",
  "60_80",
  "80_120",
  "120_plus",
]);

const PRICE_RANGE_SOURCE_IDS = new Set([
  "self_reported",
  "inferred_from_legacy_budget_tag",
]);

const GENDER_IDS = new Set(["female", "male", "other", "unspecified"]);
const AGE_RANGE_IDS = new Set(["18_24", "25_34", "35_44", "45_plus"]);
const VIBE_IDS = new Set(["people", "experience", "both"]);
const EXPERIENCE_IDS = new Set(["curious", "experienced"]);
const LANGUAGE_IDS = new Set(["english", "dutch", "both"]);
const SUNDAY_AVAILABILITY_IDS = new Set(["afternoon", "evening", "both", "no"]);
const ALT_DAY_IDS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

function parseStringArray(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && allowed.has(item),
  );
}

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

function parsePriceRanges(
  value: unknown,
): WaitlistPreferences["priceRanges"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ticket: [], allInclusive: [] };
  }
  const raw = value as Record<string, unknown>;
  return {
    ticket: parseStringArray(
      raw.ticket,
      TICKET_PRICE_IDS,
    ) as WaitlistPreferences["priceRanges"]["ticket"],
    allInclusive: parseStringArray(
      raw.allInclusive,
      ALL_INCLUSIVE_PRICE_IDS,
    ) as WaitlistPreferences["priceRanges"]["allInclusive"],
  };
}

/** New submissions always send "self_reported" (see the waitlist modal) —
 * "inferred_from_legacy_budget_tag" only ever appears on rows the drizzle/0020
 * migration backfilled from the old 3-option budget field, never on a fresh
 * POST here, so an invalid/missing value safely defaults to self_reported. */
function parsePriceRangeSource(
  value: unknown,
): WaitlistPreferences["priceRangeSource"] {
  return typeof value === "string" && PRICE_RANGE_SOURCE_IDS.has(value)
    ? (value as WaitlistPreferences["priceRangeSource"])
    : "self_reported";
}

function parsePreferences(
  value: unknown,
  cities: string[],
): WaitlistPreferences | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const interests = Array.isArray(raw.interests)
    ? raw.interests.filter((item): item is string => typeof item === "string")
    : [];
  const why = Array.isArray(raw.why)
    ? raw.why.filter((item): item is string => typeof item === "string")
    : [];
  const company = Array.isArray(raw.company)
    ? raw.company.filter((item): item is string => typeof item === "string")
    : [];
  const tableType = Array.isArray(raw.tableType)
    ? raw.tableType.filter((item): item is string => typeof item === "string")
    : [];
  const priceRanges = parsePriceRanges(raw.priceRanges);
  const priceRangeSource = parsePriceRangeSource(raw.priceRangeSource);
  const gender = parseStringArray(raw.gender, GENDER_IDS);
  const ageRange = parseStringArray(raw.ageRange, AGE_RANGE_IDS);
  const vibe = parseStringArray(raw.vibe, VIBE_IDS);
  const experience = parseStringArray(raw.experience, EXPERIENCE_IDS);
  const language = parseStringArray(raw.language, LANGUAGE_IDS);
  const sundayAvailability = parseStringArray(
    raw.sundayAvailability,
    SUNDAY_AVAILABILITY_IDS,
  );
  const altDays = parseStringArray(raw.altDays, ALT_DAY_IDS);
  const whyOther =
    typeof raw.whyOther === "string" ? raw.whyOther.trim().slice(0, 200) : "";

  if (
    !interests.length &&
    !why.length &&
    !company.length &&
    !tableType.length &&
    !gender.length &&
    !ageRange.length &&
    !vibe.length &&
    !priceRanges.ticket.length &&
    !priceRanges.allInclusive.length &&
    !experience.length &&
    !language.length &&
    !sundayAvailability.length &&
    !altDays.length &&
    !whyOther
  ) {
    return null;
  }

  return {
    interests: interests as WaitlistPreferences["interests"],
    priceRanges,
    priceRangeSource,
    why: why as WaitlistPreferences["why"],
    company: company as WaitlistPreferences["company"],
    joinIntent: (Array.isArray(raw.joinIntent)
      ? raw.joinIntent.filter((item): item is string => typeof item === "string")
      : []) as WaitlistPreferences["joinIntent"],
    tableType: tableType as WaitlistPreferences["tableType"],
    cities,
    regionFlexible: Boolean(raw.regionFlexible),
    gender: gender as WaitlistPreferences["gender"],
    ageRange: ageRange as WaitlistPreferences["ageRange"],
    vibe: vibe as WaitlistPreferences["vibe"],
    experience: experience as WaitlistPreferences["experience"],
    language: language as WaitlistPreferences["language"],
    sundayAvailability:
      sundayAvailability as WaitlistPreferences["sundayAvailability"],
    altDays: altDays as WaitlistPreferences["altDays"],
    whyOther,
  };
}

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Waitlist is not available." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`waitlist:${ip}`)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: {
    email?: string;
    city?: string;
    cities?: string[];
    name?: string;
    locale?: string;
    source?: "waitlist" | "newsletter";
    /** True for the second (preferences) POST of the two-step capture flow. */
    enrich?: boolean;
    /** True only on the enrich POST that actually finishes the flow — either
     * by completing the last question or by hitting "skip". Every other
     * enrich POST is just an in-progress autosave (see savePreferences in
     * the modal) and must not trigger the welcome email. */
    complete?: boolean;
    /** Echoed back from the capture response (`created`) so the completion
     * POST — which never re-runs createWaitlistSignup's insert — can still
     * tell whether this is a first-time signup worth welcoming. */
    isNewSignup?: boolean;
    preferences?: unknown;
    meta?: {
      fbp?: string;
      fbc?: string;
      eventSourceUrl?: string;
    };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim();
  const locale: Locale = body.locale === "en" ? "en" : "nl";
  const name = body.name?.trim() || undefined;
  const cities = Array.from(
    new Set(
      (body.cities?.length ? body.cities : body.city ? [body.city] : [])
        .map((city) => city.trim())
        .filter(Boolean),
    ),
  );

  if (!email || cities.length === 0) {
    return NextResponse.json(
      { error: "Email and at least one city are required." },
      { status: 400 },
    );
  }

  const preferences = parsePreferences(body.preferences, cities);
  const enrich = body.enrich === true;
  const signupIds: string[] = [];
  const createdFlags: boolean[] = [];

  for (const city of cities) {
    const result = await createWaitlistSignup({
      email,
      city,
      locale,
      name,
      source: "waitlist",
      preferences,
    });
    if (!result.ok) {
      if (result.error === "database_unavailable") {
        return NextResponse.json(
          { error: "Database temporarily unavailable." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // The enrichment POST (step 2 of the capture flow) only updates
    // preferences on an already-created row — skip the activity log and
    // Meta Lead event so a second POST for the same person doesn't produce
    // duplicate activity rows or corrupt ad-spend attribution.
    if (!enrich) {
      try {
        await onWaitlistJoined({
          email,
          city,
          locale,
          waitlistId: result.id,
          name: signupIds.length === 0 ? name : undefined,
          preferences: signupIds.length === 0 ? preferences : undefined,
        });
      } catch (error) {
        console.error("[waitlist] onWaitlistJoined failed:", error);
      }
    }

    signupIds.push(result.id);
    createdFlags.push(result.created);
  }

  if (!enrich) {
    const metaContext = parseMetaTrackingContext(body.meta);
    const primaryCity = cities[0]!;
    void sendMetaCapiLead({
      email,
      city: primaryCity,
      source: body.source === "newsletter" ? "newsletter" : "waitlist",
      waitlistId: signupIds[0]!,
      eventSourceUrl: metaContext.eventSourceUrl ?? getSiteUrl(),
      userData: metaUserDataFromRequest(request, metaContext, email),
    });
  }

  // Welcome email now fires once the person is done filling in the
  // questionnaire — whether they finished every question or hit "skip" —
  // never on the bare capture step and never on an in-progress autosave.
  // `isNewSignup` guards against re-sending it to someone who reopens the
  // modal and completes the flow again for a city they already joined.
  //
  // A "complete" POST can itself arrive more than once for the same
  // person (a double-tap on the finish/skip button with no loading state
  // on a slow connection previously sent the welcome email once per tap),
  // so the actual send is gated behind an atomic per-signup claim —
  // whichever POST claims it first sends the email, every later duplicate
  // sees it already claimed and skips.
  if (enrich && body.complete === true && body.isNewSignup === true) {
    const welcomeSignupId = signupIds[0]!;
    void claimWaitlistWelcomeEmail(welcomeSignupId)
      .then(async (claimed) => {
        if (!claimed) return;
        try {
          const gender = preferences?.gender?.[0];
          await sendSundayTableWaitlistWelcomeEmail({
            to: email,
            locale,
            firstName: name,
            city: cities[0]!,
            gender,
          });
        } catch (error) {
          console.error(
            "[waitlist] sendSundayTableWaitlistWelcomeEmail failed:",
            error,
          );
          // Sending failed after we claimed it — release so a later
          // legitimate attempt (or a manual resend) can still go out.
          await releaseWaitlistWelcomeEmailClaim(welcomeSignupId).catch(
            () => {},
          );
        }
      })
      .catch((error: unknown) => {
        console.error("[waitlist] claimWaitlistWelcomeEmail failed:", error);
      });
  }

  return NextResponse.json({
    ok: true,
    id: signupIds[0],
    ids: signupIds,
    created: createdFlags[0] ?? false,
  });
}
