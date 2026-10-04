import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { cancelMemberSeat } from "@/lib/membership/bookings";
import { captureClientSafeError } from "@/lib/membership/errors";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";

/**
 * POST /api/membership/cancel-seat: a member cancels their own booking,
 * until 48 hours before the start (see MEMBER_SEAT_CANCEL_HOURS). Body
 * { bookingId }. Only for the signed-in person's own booking. No refund,
 * also not for a paid guest seat.
 */
export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { bookingId?: unknown };
  if (typeof body.bookingId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.bookingId)) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }
  try {
    const result = await cancelMemberSeat({ bookingId: body.bookingId, email: user.email });
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }
    void captureServerEvent(user.id, PostHogEvents.memberSeatCancelled, { refunded: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureClientSafeError(error, "member_seat_cancel", { booking_id: body.bookingId });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
