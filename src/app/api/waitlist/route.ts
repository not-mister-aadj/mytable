import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { createWaitlistSignup } from "@/lib/waitlist-data";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import { sendSundayTableWaitlistWelcomeEmail } from "@/lib/email/sendSundayTableWaitlistEmails";
import { sendMetaCapiLead } from "@/lib/analytics/metaCapi";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { metaUserDataFromRequest } from "@/lib/analytics/metaCapiContext";
import type { Locale } from "@/i18n/config";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";
import { getSiteUrl } from "@/lib/env";

const PRICE_RANGE_IDS = new Set([
  "upto_50",
  "50_75",
  "75_100",
  "100_plus",
]);

const INTEREST_IDS = new Set([
  "wine_tasting",
  "chefs_special",
  "wine_walk",
  "food_walk",
  "aperitivo",
]);

const GENDER_IDS = new Set(["female", "male", "other", "unspecified"]);
const AGE_RANGE_IDS = new Set(["18_24", "25_34", "35_44", "45_plus"]);
const VIBE_IDS = new Set(["people", "experience", "both"]);
const BUDGET_IDS = new Set(["budget", "premium", "flexible"]);
const EXPERIENCE_IDS = new Set(["curious", "experienced"]);
const LANGUAGE_IDS = new Set(["english", "dutch", "both"]);

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
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const result: WaitlistPreferences["priceRanges"] = {};

  for (const [key, ranges] of Object.entries(raw)) {
    if (!INTEREST_IDS.has(key) || !Array.isArray(ranges)) continue;
    const cleaned = ranges.filter(
      (item): item is string =>
        typeof item === "string" && PRICE_RANGE_IDS.has(item),
    );
    if (cleaned.length > 0) {
      result[key as keyof WaitlistPreferences["priceRanges"]] =
        cleaned as NonNullable<
          WaitlistPreferences["priceRanges"][keyof WaitlistPreferences["priceRanges"]]
        >;
    }
  }

  return result;
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
  const gender = parseStringArray(raw.gender, GENDER_IDS);
  const ageRange = parseStringArray(raw.ageRange, AGE_RANGE_IDS);
  const vibe = parseStringArray(raw.vibe, VIBE_IDS);
  const budget = parseStringArray(raw.budget, BUDGET_IDS);
  const experience = parseStringArray(raw.experience, EXPERIENCE_IDS);
  const language = parseStringArray(raw.language, LANGUAGE_IDS);
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
    !budget.length &&
    !experience.length &&
    !language.length &&
    !whyOther
  ) {
    return null;
  }

  return {
    interests: interests as WaitlistPreferences["interests"],
    priceRanges,
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
    budget: budget as WaitlistPreferences["budget"],
    experience: experience as WaitlistPreferences["experience"],
    language: language as WaitlistPreferences["language"],
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

    if (createdFlags[0]) {
      void sendSundayTableWaitlistWelcomeEmail({
        to: email,
        locale,
        firstName: name,
        city: cities[0]!,
      }).catch((error: unknown) => {
        console.error(
          "[waitlist] sendSundayTableWaitlistWelcomeEmail failed:",
          error,
        );
      });
    }
  }

  return NextResponse.json({ ok: true, id: signupIds[0], ids: signupIds });
}
