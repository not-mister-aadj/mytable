import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { removeFriend, setLike, withdrawReport } from "@/lib/tafelvrienden/server";

/**
 * Tafelvrienden on the settings page (POST /api/auth/member/tafelvrienden),
 * only for the signed-in person's own picks and reports:
 * { action: "like", bookingId, mateBookingId, on } while the week after a Sunday is open,
 * { action: "remove", email } to take someone off their list,
 * { action: "withdraw", reportId } to withdraw a report.
 */
export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length < 200 ? v : null);
  try {
    if (body.action === "like") {
      const bookingId = str(body.bookingId);
      const mateBookingId = str(body.mateBookingId);
      if (!bookingId || !mateBookingId || typeof body.on !== "boolean") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      const ok = await setLike(user.email, bookingId, mateBookingId, body.on);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    if (body.action === "remove") {
      const email = str(body.email);
      if (!email) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      await removeFriend(user.email, email);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "withdraw") {
      const reportId = str(body.reportId);
      if (!reportId) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      const ok = await withdrawReport(user.email, reportId);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("[tafelvrienden] save failed:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
