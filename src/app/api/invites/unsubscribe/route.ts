import { eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import { supportedCity } from "@/lib/jouw-tafel/logic";

/**
 * One-click unsubscribe (List-Unsubscribe-Post, RFC 8058): turns every
 * followed city to "none" for the person behind the token. A GET (someone
 * opening the link) shows their city settings instead.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!isDbConfigured() || !token) return NextResponse.json({ ok: false }, { status: 400 });
  const db = getDb();
  const [sub] = await db.select().from(inviteSubscribers).where(eq(inviteSubscribers.token, token)).limit(1);
  if (!sub) return NextResponse.json({ ok: false }, { status: 404 });
  const rows = (await db.execute(sql`
    select distinct city from waitlist_signups where lower(email) = ${sub.emailNormalized}
  `)) as unknown as Array<{ city: string }>;
  const prefs: Record<string, "none"> = {};
  for (const r of rows) {
    const city = supportedCity(r.city);
    if (city) prefs[city] = "none";
  }
  await db.update(inviteSubscribers).set({ cityPrefs: prefs, updatedAt: new Date() }).where(eq(inviteSubscribers.token, token));
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(`${getSiteUrl().replace(/\/$/, "")}/uitnodigingen/${encodeURIComponent(token)}`);
}
