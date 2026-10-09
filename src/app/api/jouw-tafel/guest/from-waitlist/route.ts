import { NextResponse } from "next/server";
import type { Locale } from "@/i18n/config";
import { normalizeAuthEmail, validateAuthEmail } from "@/lib/jouw-tafel/auth-logic";
import { getJouwTafelEvents } from "@/lib/jouw-tafel/data";
import {
  GUEST_COOKIE,
  createGuest,
  emailHasAccount,
  getCookieGuest,
  guestCookieOptions,
  saveGuestState,
} from "@/lib/jouw-tafel/guest-server";
import { answerCities, isQuizComplete, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { accountWelcomeVariant } from "@/lib/jouw-tafel/welcome-logic";

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
 * The end of the waitlist questions (POST /api/jouw-tafel/guest/from-waitlist).
 * Body: { email, locale, answers } with the answers in the quiz's shape.
 * Puts them on a guest row (and its cookie), so "Kies je zondag" opens with
 * them and the quiz only asks what was skipped; reserving makes the account
 * and moves them in. Answers { kies: true } when a table is open in one of
 * their cities, else { kies: false } (then the modal says they are on the
 * list). An address with an account already gets { kies: false } and no row.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`guest-waitlist:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: { email?: unknown; locale?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const raw = typeof body.email === "string" ? body.email : "";
  if (validateAuthEmail(raw)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const email = normalizeAuthEmail(raw);
  const locale: Locale = body.locale === "en" ? "en" : "nl";
  const t = Date.now();
  const { answers } = sanitizeQuizState({ answers: body.answers });

  try {
    if (await emailHasAccount(email)) return NextResponse.json({ kies: false });
    const current = await getCookieGuest();
    const guest = current && current.email === email ? current : await createGuest({ email, locale });
    // Answers already given in this browser stay; the waitlist ones fill in.
    const merged = { ...answers, ...guest.state.answers };
    const state = sanitizeQuizState({
      ...guest.state,
      answers: merged,
      startedAt: guest.state.startedAt ?? t,
      updatedAt: t,
      completedAt: guest.state.completedAt ?? (isQuizComplete(merged) ? t : undefined),
    });
    await saveGuestState(guest.id, state, { fromWaitlist: true });

    const { events, now } = await getJouwTafelEvents();
    const kies = accountWelcomeVariant(answerCities(state.answers), events, now, locale).variant === "open";
    const response = NextResponse.json({ kies });
    response.cookies.set(GUEST_COOKIE, guest.id, guestCookieOptions);
    return response;
  } catch (error) {
    console.error("[jouw-tafel guest] from waitlist failed:", error);
    return NextResponse.json({ kies: false });
  }
}
