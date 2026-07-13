import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { createWaitlistSignup } from "@/lib/waitlist-data";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import { sendMetaCapiLead } from "@/lib/analytics/metaCapi";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { metaUserDataFromRequest } from "@/lib/analytics/metaCapiContext";
import type { Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";

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
    signupSource?: "waitlist" | "priority_list";
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

  const signupIds: string[] = [];
  const signupSource =
    body.signupSource === "priority_list" ? "priority_list" : "waitlist";

  for (const city of cities) {
    const result = await createWaitlistSignup({
      email,
      city,
      locale,
      name,
      source: signupSource,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await onWaitlistJoined({
      email,
      city,
      locale,
      waitlistId: result.id,
      name: signupIds.length === 0 ? name : undefined,
    });

    signupIds.push(result.id);
  }

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

  return NextResponse.json({ ok: true, id: signupIds[0], ids: signupIds });
}
