import { NextResponse } from "next/server";
import { declineMembershipOffer } from "@/lib/membership/offer";

/**
 * POST /api/membership/offer/decline: "no thanks" on the offer after a paid
 * Sunday Social. Body { sessionId }. That booking's offer never shows again.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { sessionId?: unknown } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 200) : "";
  if (sessionId) {
    await declineMembershipOffer(sessionId).catch((error: unknown) => {
      console.error("[membership offer] decline failed", error);
    });
  }
  return NextResponse.json({ ok: true });
}
