import { SignJWT, decodeJwt, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/admin-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTokenSecrets } from "@/lib/sunday-table-intro";

/**
 * Signed in from a mail. Everyone who books gets an account without asking
 * for one, so a log-in screen comes as a surprise. A button in a mail that
 * leads to a page behind the log-in carries a link that signs them in on that
 * device and goes on to the page.
 *
 * Only in mails people keep to themselves (their booking, their membership),
 * never in an invitation or the location mail: those get forwarded.
 *
 * A session made this way is remembered on the account (app_metadata, by
 * session id, so nothing in the browser can undo it). Cancelling, moving a
 * booking, the membership and deleting the account ask for a fresh code from
 * such a session: a forwarded mail never reaches those.
 */

const PURPOSE = "mail-login";
/** How long the link in the mail signs in. */
export const MAIL_LOGIN_DAYS = 7;
const SESSIONS_KEY = "mail_sessions";
const SESSIONS_KEPT = 12;
/** What a route answers (403) when the step needs a fresh code first. */
export const CODE_REQUIRED = "code_required";

export async function signMailLoginToken(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAIL_LOGIN_DAYS * 24 * 60 * 60}s`)
    .sign(getTokenSecrets()[0]!);
}

/** The email the link was made for, or null when it is not ours or too old. */
export async function verifyMailLoginToken(token: string): Promise<string | null> {
  for (const secret of getTokenSecrets()) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.purpose !== PURPOSE) return null;
      return typeof payload.email === "string" && payload.email.includes("@") ? payload.email : null;
    } catch {
      // Not this key: try the next one.
    }
  }
  return null;
}

/** The link for a button in a mail: signs this person in and goes on to `path` (a path on our own site). */
export async function mailLoginUrl(email: string, path: string, base: string = getSiteUrl()): Promise<string> {
  const token = await signMailLoginToken(email);
  return `${base.replace(/\/$/, "")}/auth/in?t=${token}&naar=${encodeURIComponent(path)}`;
}

function sessionIdOf(accessToken: string | undefined | null): string | null {
  if (!accessToken) return null;
  try {
    const id = decodeJwt(accessToken).session_id;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

function mailSessions(appMetadata: Record<string, unknown> | undefined | null): string[] {
  const list = appMetadata?.[SESSIONS_KEY];
  return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
}

/**
 * Signs this browser in as the account of `email`, without a code, and marks
 * the session as one that came from a mail. Only for an account that exists.
 * Sets cookies: call from a route handler.
 */
export async function signInFromMail(email: string): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const hash = data?.properties?.hashed_token;
    if (error || !hash || !data.user) return false;
    const supabase = await createSupabaseServerClient();
    const verified = await supabase.auth.verifyOtp({ token_hash: hash, type: "magiclink" });
    const session = verified.data.session;
    if (verified.error || !session) return false;
    const sessionId = sessionIdOf(session.access_token);
    if (!sessionId) {
      // Not markable as a mail session: no session at all, rather than one that may do everything.
      await supabase.auth.signOut({ scope: "local" });
      return false;
    }
    const kept = [...mailSessions(data.user.app_metadata), sessionId].slice(-SESSIONS_KEPT);
    const marked = await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { [SESSIONS_KEY]: kept } });
    if (marked.error) {
      await supabase.auth.signOut({ scope: "local" });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[mail-login] signing in failed:", error);
    return false;
  }
}

/** Is the session in this browser one that came from a mail (no code typed)? */
export async function isMailSession(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const sessionId = sessionIdOf(session?.access_token);
    // A session we cannot read is treated as one from a mail: the careful side.
    if (!sessionId) return mailSessions(user.app_metadata).length > 0;
    return mailSessions(user.app_metadata).includes(sessionId);
  } catch {
    return false;
  }
}

/** For a route behind the log-in whose step needs a code typed: the 403 to return, or null to go on. */
export async function codeRequiredResponse(): Promise<NextResponse | null> {
  return (await isMailSession()) ? NextResponse.json({ error: CODE_REQUIRED }, { status: 403 }) : null;
}
