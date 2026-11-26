import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { normalizeAuthEmail, validateAuthEmail } from "@/lib/jouw-tafel/auth-logic";
import { getRunningMembershipByEmail, membershipSnapshot } from "@/lib/membership/data";
import { memberBookingDecision } from "@/lib/membership/logic";

const rateLimit = new Map<string, { count: number; reset: number }>();

function allowed(key: string, max = 20, windowMs = 60_000): boolean {
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
 * POST /api/booking/lookup { email, startsAt? }: step 1 of the booking card.
 * Says only what kind of address it is, never anything about the person:
 * "member" (a running club membership that covers this Sunday: log in to
 * book with it), "known" (an account exists: a login code fills in the
 * card), or "new". Rate limited per IP.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowed(`booking-lookup:${ip}`)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: { email?: unknown; startsAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const raw = typeof body.email === "string" ? body.email : "";
  if (validateAuthEmail(raw)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const email = normalizeAuthEmail(raw);
  if (!isDbConfigured()) return NextResponse.json({ kind: "new" });

  const startsAt = typeof body.startsAt === "string" && !Number.isNaN(Date.parse(body.startsAt)) ? new Date(body.startsAt) : new Date();
  const membership = membershipSnapshot(await getRunningMembershipByEmail(email).catch(() => null));
  if (membership && memberBookingDecision(membership, startsAt).kind !== "non_member") {
    return NextResponse.json({ kind: "member" });
  }
  const rows = (await getDb()
    .execute(sql`select 1 as x from auth.users where lower(email) = ${email} limit 1`)
    .catch(() => [])) as unknown as Array<{ x: number }>;
  return NextResponse.json({ kind: rows.length > 0 ? "known" : "new" });
}
