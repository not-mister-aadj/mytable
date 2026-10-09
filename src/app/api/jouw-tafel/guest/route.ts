import { NextResponse } from "next/server";
import type { Locale } from "@/i18n/config";
import { normalizeAuthEmail, validateAuthEmail } from "@/lib/jouw-tafel/auth-logic";
import {
  GUEST_COOKIE,
  createGuest,
  emailHasAccount,
  getCookieGuest,
  guestCookieOptions,
} from "@/lib/jouw-tafel/guest-server";

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

/**
 * "Wat is je e-mail?" (POST /api/jouw-tafel/guest): the start of "Jouw
 * tafel" without an account. Body: { email, locale }.
 * - An address that already has an account: { account: true }, the form
 *   sends them to log in.
 * - Otherwise a guest row and its cookie (the same row again when this
 *   browser already has one for that address): { ok: true }.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`guest:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: { email?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const raw = typeof body.email === "string" ? body.email : "";
  if (validateAuthEmail(raw)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const email = normalizeAuthEmail(raw);
  const locale: Locale = body.locale === "en" ? "en" : "nl";

  try {
    if (await emailHasAccount(email)) return NextResponse.json({ account: true });
    const current = await getCookieGuest();
    const guest = current && current.email === email ? current : await createGuest({ email, locale });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(GUEST_COOKIE, guest.id, guestCookieOptions);
    return response;
  } catch (error) {
    console.error("[jouw-tafel guest] start failed:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
