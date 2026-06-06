import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { createWaitlistSignup } from "@/lib/waitlist-data";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import type { Locale } from "@/i18n/config";

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

  let body: { email?: string; city?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim();
  const city = body.city?.trim();
  const locale: Locale = body.locale === "en" ? "en" : "nl";

  if (!email || !city) {
    return NextResponse.json(
      { error: "Email and city are required." },
      { status: 400 },
    );
  }

  const result = await createWaitlistSignup({ email, city, locale });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await onWaitlistJoined({
    email,
    city,
    locale,
    waitlistId: result.id,
  });

  return NextResponse.json({ ok: true });
}
