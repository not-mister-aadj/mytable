import { eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteClicks, inviteSends, inviteSubscribers } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import { mailLoginUrl } from "@/lib/auth/mail-login";
import { recipientRef } from "@/lib/email/tracked-link";
import { sundaySocialDatePath } from "@/lib/sunday-social-cities";
import { events } from "@/db/schema";

/**
 * A link in an invite (/r/{code}{n}): counts the click, then opens the
 * Sunday (n = its place in the mail) with the mail's UTM tags, or for
 * n = 0 ("keep inviting me") the city settings with a thank-you.
 *
 * The Sunday opens signed in as the person the invite went to (through
 * /auth/in, like the buttons in our other mails), with "Alleen deze zondag"
 * already chosen, so the booking card has their details filled in. Only for
 * an invite sent in the last SIGN_IN_DAYS days and an account that exists;
 * otherwise the Sunday opens as before. Signing in from a mail never allows
 * the sensitive steps (they ask for a code, see codeRequiredResponse).
 */
const SIGN_IN_DAYS = 30;

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
  target.searchParams.set("ticket", "deze-zondag");
  const recent = send.sentAt && Date.now() - new Date(send.sentAt).getTime() < SIGN_IN_DAYS * 86_400_000;
  if (recent && (await hasAccount(send.emailNormalized))) {
    return NextResponse.redirect(await mailLoginUrl(send.emailNormalized, `${target.pathname}${target.search}`, site));
  }
  return NextResponse.redirect(target.toString());
}

async function hasAccount(email: string): Promise<boolean> {
  const rows = (await getDb()
    .execute(sql`select 1 as x from auth.users where lower(email) = ${email} limit 1`)
    .catch(() => [])) as unknown as Array<{ x: number }>;
  return rows.length > 0;
}
