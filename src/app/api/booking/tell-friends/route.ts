import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { bookings } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * "Nog één laatste stap" after paying (POST { sessionId, tell }): for
 * a booker who did not see the checkbox in the card. The Stripe session id
 * in the return URL is the proof it is their booking. Only sets it when it
 * was never asked, so it can't overrule a "no" from the card.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { sessionId?: unknown; tell?: unknown } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId.startsWith("cs_")) return NextResponse.json({ ok: false }, { status: 400 });
  const rows = await getDb()
    .update(bookings)
    .set({ tellFriends: body?.tell !== false })
    .where(and(eq(bookings.stripeCheckoutSessionId, sessionId), eq(bookings.paymentStatus, "paid"), isNull(bookings.tellFriends)))
    .returning({ id: bookings.id });
  return NextResponse.json({ ok: rows.length > 0 });
}
