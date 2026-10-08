import type { Locale } from "@/i18n/config";

/** Where the middleware sends a failed Google round that landed on the homepage. */
export const OAUTH_RESUME_PATH = "/auth/resume";

/** Supabase error codes for a Google return it can no longer match to a sign-in. */
const STATE_ERROR_CODES = new Set([
  "bad_oauth_state",
  "bad_oauth_callback",
  "flow_state_not_found",
  "flow_state_expired",
]);

/**
 * When Supabase gets a Google return it cannot place (the same return a
 * second time, after the back button or a reload during sign-in), it no
 * longer knows where to send someone and falls back to the Site URL: the
 * homepage, with the error in the query string. Often the first round did
 * sign them in. Returns the homepage locale for such a landing, else null.
 */
export function oauthStateErrorLocale(
  pathname: string,
  searchParams: URLSearchParams,
): Locale | null {
  const locale: Locale | null =
    pathname === "/" || pathname === "/nl" ? "nl" : pathname === "/en" ? "en" : null;
  if (!locale) return null;
  const code = searchParams.get("error_code");
  if (code && STATE_ERROR_CODES.has(code)) return locale;
  const description = searchParams.get("error_description") ?? "";
  if (searchParams.has("error") && /oauth state/i.test(description)) return locale;
  return null;
}
