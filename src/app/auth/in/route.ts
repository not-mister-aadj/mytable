import { NextResponse, type NextRequest } from "next/server";
import { jouwTafelLogInPath, jouwTafelSettingsPath, type Locale } from "@/i18n/config";
import { signInFromMail, verifyMailLoginToken } from "@/lib/auth/mail-login";
import { getMemberUser } from "@/lib/member-auth";

/**
 * /auth/in?t=<token>&naar=<path>: the button in a mail (see mail-login.ts).
 * Signs the person in and goes on to the page; a link that is too old or not
 * ours goes to the log-in screen, with the page kept for after it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const naar = params.get("naar") ?? "";
  const locale: Locale = naar.startsWith("/en/") || naar === "/en" ? "en" : "nl";
  // Only a path on our own site, and never the admin or an API.
  const safe = naar.startsWith("/") && !naar.startsWith("//") && !/^\/(admin|api|auth)(\/|$)/.test(naar);
  const path = safe ? naar : jouwTafelSettingsPath(locale);

  const go = (to: string) => NextResponse.redirect(new URL(to, request.nextUrl.origin));
  const email = await verifyMailLoginToken(params.get("t") ?? "");
  const toLogIn = () => go(`${jouwTafelLogInPath(locale)}?naar=${encodeURIComponent(path)}`);
  if (!email) return toLogIn();

  // Already signed in as this person: nothing to do, and their own session stays as it is.
  const user = await getMemberUser();
  if (user?.email?.trim().toLowerCase() === email) return go(path);

  return (await signInFromMail(email)) ? go(path) : toLogIn();
}
