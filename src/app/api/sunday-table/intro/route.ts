import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import {
  findSundayTableIntroBooking,
  findSundayTableIntroBookingByCode,
  hasAnyIntroAnswer,
  parseSundayTableIntro,
  saveSundayTableIntro,
  verifySundayTableIntroToken,
} from "@/lib/sunday-table-intro";

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

/** Saves a guest's "meet your table" answers. The booking is identified by the
 * Stripe checkout session (confirmation page right after payment), by the
 * signed token from the reminder email, or, when a link lost its token, by the
 * booking number together with the booking email. Never by a plain booking id. */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`intro:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    sessionId?: unknown;
    token?: unknown;
    reservationCode?: unknown;
    email?: unknown;
    intro?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let booking = null;
  if (typeof body.sessionId === "string" && body.sessionId.startsWith("cs_")) {
    booking = await findSundayTableIntroBooking({ checkoutSessionId: body.sessionId });
  } else if (typeof body.token === "string") {
    const bookingId = await verifySundayTableIntroToken(body.token);
    if (bookingId) booking = await findSundayTableIntroBooking({ bookingId });
  } else if (typeof body.reservationCode === "string" && typeof body.email === "string") {
    // Typed in by hand, so guessable: a much tighter limit than the links.
    if (!checkRateLimit(`intro-code:${ip}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    booking = await findSundayTableIntroBookingByCode(body.reservationCode, body.email);
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const intro = parseSundayTableIntro(body.intro);
  // An empty save (e.g. the form reloaded blank) must never wipe answers
  // that were saved earlier.
  if (!hasAnyIntroAnswer(intro)) {
    return NextResponse.json({ error: "No answers" }, { status: 400 });
  }

  await saveSundayTableIntro(booking.id, intro);
  return NextResponse.json({ ok: true });
}
