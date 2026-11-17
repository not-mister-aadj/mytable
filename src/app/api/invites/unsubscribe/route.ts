import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import { citiesForEmail } from "@/lib/invites/cities";
import type { CityPref } from "@/lib/invites/logic";
import { recordPrefChange } from "@/lib/invites/pref-changes";

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
  const prefs: Record<string, "none"> = {};
  const followed = await citiesForEmail(sub.emailNormalized);
  for (const city of followed) prefs[city] = "none";
  await db.update(inviteSubscribers).set({ cityPrefs: prefs, updatedAt: new Date() }).where(eq(inviteSubscribers.token, token));
  await recordPrefChange({ email: sub.emailNormalized, source: "one_click", before: (sub.cityPrefs ?? {}) as Record<string, CityPref>, after: prefs, followed });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(`${getSiteUrl().replace(/\/$/, "")}/uitnodigingen/${encodeURIComponent(token)}`);
}
