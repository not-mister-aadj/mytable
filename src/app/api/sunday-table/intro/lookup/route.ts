import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { findSundayTableIntroBookingByCode } from "@/lib/sunday-table-intro";

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 5, windowMs = 10 * 60_000): boolean {
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

/** For the manual version of the "meet your table" form: once a guest has
 * typed their booking number and email, returns what they saved before so
 * the form can show it. Same check as saving (number and email must match
 * one paid Sunday Table booking), with the same tight limit on attempts. */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`intro-lookup:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { reservationCode?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.reservationCode !== "string" || typeof body.email !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const booking = await findSundayTableIntroBookingByCode(body.reservationCode, body.email);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    reservationCode: booking.reservationCode,
    city: booking.city,
    seats: booking.seats,
    intro: booking.intro,
  });
}
