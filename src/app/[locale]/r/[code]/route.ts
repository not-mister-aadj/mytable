import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteClicks, inviteSends, inviteSubscribers } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import { recipientRef } from "@/lib/email/tracked-link";
import { sundaySocialDatePath } from "@/lib/sunday-social-cities";
import { events } from "@/db/schema";

/**
 * A link in an invite (/r/{code}{n}): counts the click, then opens the
 * Sunday (n = its place in the mail) with the mail's UTM tags, or for
 * n = 0 ("keep inviting me") the city settings with a thank-you.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const site = getSiteUrl().replace(/\/$/, "");
  const home = NextResponse.redirect(`${site}/`);
  if (!isDbConfigured()) return home;
  const raw = (await context.params).code ?? "";
  const match = raw.match(/^([A-Za-z0-9]{8})(\d)$/);
  if (!match) return home;
  const db = getDb();
  const [send] = await db.select().from(inviteSends).where(eq(inviteSends.code, match[1]!)).limit(1);
  if (!send) return home;
  const index = Number(match[2]);
  const eventId = index > 0 ? (send.eventIds[index - 1] ?? null) : null;
  await db.insert(inviteClicks).values({ sendId: send.id, eventId }).catch(() => undefined);

  const locale = send.locale === "en" ? "en" : "nl";
  if (index === 0) {
    const [sub] = await db.select().from(inviteSubscribers).where(eq(inviteSubscribers.emailNormalized, send.emailNormalized)).limit(1);
    return NextResponse.redirect(sub ? `${site}${locale === "en" ? "/en" : ""}/uitnodigingen/${sub.token}?bevestigd=1` : `${site}/`);
  }
  const [event] = eventId ? await db.select({ city: events.city, startsAt: events.startsAt }).from(events).where(eq(events.id, eventId)).limit(1) : [];
  const path = event ? sundaySocialDatePath(locale, event) : null;
  if (!path) return home;
  const campaign = send.kind === "nudge" ? "herinnering" : "uitnodiging";
  const target = new URL(`${site}${path}`);
  target.searchParams.set("utm_source", "mail");
  target.searchParams.set("utm_medium", "email");
  target.searchParams.set("utm_campaign", campaign);
  target.searchParams.set("r", recipientRef(campaign, send.emailNormalized));
  return NextResponse.redirect(target.toString());
}
