import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import type { SundayTableSignupProfile } from "@/db/schema";
import { getMemberUser } from "@/lib/member-auth";
import {
  ONBOARDING_CITIES,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { createSundayTableSignup } from "@/lib/sunday-table-signups-data";
import {
  isSundayTableRsvpOpen,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

const PLAN_IDS = new Set(["1m", "6m"]);
const TABLE_TYPES = new Set(["girls_only", "mixed"]);

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 10, windowMs = 60_000): boolean {
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
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
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
  const planId = typeof raw.planId === "string" ? raw.planId.trim() : "";
  const locale =
    typeof raw.locale === "string" && (raw.locale === "en" || raw.locale === "nl")
      ? raw.locale
      : "nl";

  if (!(ONBOARDING_CITIES as readonly string[]).includes(city)) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!TABLE_TYPES.has(tableType)) {
    return NextResponse.json({ error: "Invalid table type" }, { status: 400 });
  }
  if (!PLAN_IDS.has(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const tableSunday = parseAmsterdamDateIso(tableDate);
  if (!tableSunday || !isSundayTableRsvpOpen(tableSunday)) {
    return NextResponse.json({ error: "Signup closed" }, { status: 403 });
  }

  const { prefs } = readOnboardingFromMetadata(
    user.user_metadata as Record<string, unknown>,
  );
  const name =
    prefs.name.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null);

  try {
    const result = await createSundayTableSignup({
      email: user.email,
      name,
      city,
      tableDate,
      tableType: tableType as "girls_only" | "mixed",
      planId,
      locale,
      userId: user.id,
      profile: profileFromPrefs(prefs),
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
      alreadySignedUp: result.alreadySignedUp,
    });
  } catch (error) {
    console.error("[sunday-table-signup]", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
