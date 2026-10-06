import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { getMemberUser } from "@/lib/member-auth";
import { rescheduleOwnBooking } from "@/lib/jouw-tafel/reschedule-server";
import { isEmailFrozen } from "@/lib/customers/freeze";
import { FROZEN_ERROR_CODE, frozenMessage } from "@/lib/customers/freeze-logic";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/bookings/reschedule { bookingId, expectedTargetEventId }: the
 * signed-in customer moves their own single Sunday Table seat to the next
 * Sunday in the same city and age bracket, up to 7 days before. Everything
 * is checked on the server; a repeat answers with where it went.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    bookingId?: unknown;
    expectedTargetEventId?: unknown;
    locale?: unknown;
  };
  // An account on hold (a disputed payment) cannot move a booking either.
  if (await isEmailFrozen(user.email)) {
    const locale = body.locale === "en" ? "en" : "nl";
    return NextResponse.json({ code: FROZEN_ERROR_CODE, error: frozenMessage(locale) }, { status: 403 });
  }
  if (typeof body.bookingId !== "string" || !UUID.test(body.bookingId)) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }
  const expected =
    typeof body.expectedTargetEventId === "string" && UUID.test(body.expectedTargetEventId)
      ? body.expectedTargetEventId
      : null;

  const result = await rescheduleOwnBooking({
    bookingId: body.bookingId,
    email: user.email,
    expectedTargetEventId: expected,
    // Members cancel their seat instead (until 48 hours before).
    isExcluded: (booking) => Boolean(booking.membershipId),
  });
  if (!result.ok) return NextResponse.json({ code: result.code, city: result.city ?? null }, { status: result.status });
  if (!result.alreadyMoved) {
    void captureServerEvent(user.id, PostHogEvents.bookingRescheduled, { days_before: result.daysBefore });
  }
  return NextResponse.json({ ok: true, newBookingId: result.newBookingId, startsAt: result.startsAt, city: result.city });
}
