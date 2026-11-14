import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { bookings, jouwTafelGuests } from "@/db/schema";
import { ensureAuthUserForEmail } from "@/lib/auth/ensure-auth-user-for-email";
import { signInFromMail } from "@/lib/auth/mail-login";
import { getCookieGuest } from "@/lib/jouw-tafel/guest-server";
import { getMemberUser } from "@/lib/member-auth";

/** After paying, this long: the confirmation page signs a new guest in. */
const WINDOW_MS = 2 * 60 * 60 * 1000;
/** Slack between two rows written in the same step. */
const SLACK_MS = 60 * 1000;

/**
 * The confirmation page, right after paying (POST { sessionId }).
 *
 * `first`: this is their first paid booking, so the page says once that they
 * now have an account.
 *
 * `signedIn`: they are signed in on this device. Without a session we sign
 * them in here, but only into an account that was born from this very
 * booking, or from the quiz done in this browser, and that nobody has ever
 * logged in to. An address typed at checkout proves nothing about who owns
 * it, so an account that existed before stays shut. The session counts as
 * one from a mail (mail-login.ts): cancelling and the like ask for a code.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { sessionId?: unknown };
  const sessionId = typeof body.sessionId === "string" && body.sessionId.startsWith("cs_") ? body.sessionId : null;
  if (!sessionId || !isDbConfigured()) return NextResponse.json({ first: false, signedIn: false });

  const db = getDb();
  const [booking] = await db
    .select({ email: bookings.email, name: bookings.customerName, createdAt: bookings.createdAt })
    .from(bookings)
    .where(and(eq(bookings.stripeCheckoutSessionId, sessionId), eq(bookings.paymentStatus, "paid")))
    .limit(1);
  if (!booking) return NextResponse.json({ first: false, signedIn: false });
  const email = booking.email.trim().toLowerCase();

  const [{ n }] = (await db.execute(
    sql`select count(*)::int as n from bookings where lower(trim(email)) = ${email} and payment_status = 'paid'`,
  )) as unknown as [{ n: number }];
  const first = n <= 1;

  const user = await getMemberUser();
  if (user) return NextResponse.json({ first, signedIn: user.email?.trim().toLowerCase() === email });
  if (Date.now() - booking.createdAt.getTime() > WINDOW_MS) return NextResponse.json({ first, signedIn: false });

  // The account is made in the background after paying: make sure it is there.
  await ensureAuthUserForEmail({ email, name: booking.name }).catch(() => null);
  const [account] = (await db.execute(
    sql`select created_at, last_sign_in_at from auth.users where lower(email) = ${email} limit 1`,
  )) as unknown as Array<{ created_at: string | Date; last_sign_in_at: string | Date | null }>;
  if (!account || account.last_sign_in_at) return NextResponse.json({ first, signedIn: false });

  const born = new Date(account.created_at).getTime();
  let ours = born >= booking.createdAt.getTime() - SLACK_MS;
  if (!ours) {
    // Or from the quiz in this browser: the guest row of this cookie, for this address.
    const guest = await getCookieGuest();
    if (guest && guest.email.trim().toLowerCase() === email) {
      const [row] = await db.select({ createdAt: jouwTafelGuests.createdAt }).from(jouwTafelGuests).where(eq(jouwTafelGuests.id, guest.id)).limit(1);
      ours = Boolean(row && born >= row.createdAt.getTime() - SLACK_MS);
    }
  }
  if (!ours) return NextResponse.json({ first, signedIn: false });
  return NextResponse.json({ first, signedIn: await signInFromMail(email) });
}
