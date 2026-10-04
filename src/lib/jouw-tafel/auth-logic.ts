// Pure helpers for the "Jouw tafel" account screens (sign up, log in,
// welcome). No browser or server APIs here so they can be unit tested:
// npx tsx --test src/lib/jouw-tafel/*.test.ts

/** Length of the code Supabase emails. Must match Auth > Providers > Email
 * > "Email OTP Length" in both Supabase projects. */
export const AUTH_CODE_LENGTH = 6;

/** Seconds before "Stuur opnieuw" can be pressed again. */
export const RESEND_COOLDOWN_SECONDS = 30;

/** Query param that marks the code step, so the back button returns to the
 * email step (`?stap=code`). The email itself never goes in the URL. */
export const CODE_STEP_PARAM = "stap";
export const CODE_STEP_VALUE = "code";

/** sessionStorage key that hands the typed email from one screen to the
 * other (log in -> "Maak een account", or a reload on the code step). Kept
 * out of the URL so it never ends up in analytics or server logs. */
export const AUTH_EMAIL_STORAGE_KEY = "mytable_jt_auth_email";

/** Accounts created this recently count as new (same window the existing
 * /auth/callback uses for Meta's CompleteRegistration). */
const NEW_USER_WINDOW_MS = 15 * 60 * 1000;

// In-app browsers (and generic webviews) where Google refuses OAuth with
// "403 disallowed_useragent". Over 95% of the ad traffic arrives in one.
const IN_APP_PATTERNS: RegExp[] = [
  /Instagram/i,
  /FBAN|FBAV|FB_IAB|FBIOS|FB4A|FBDV|FBSN/, // Facebook app
  /Messenger|Orca-Android/i, // Facebook Messenger
  /musical_ly|Bytedance|TikTok/i, // TikTok
  /Snapchat/i,
  /LinkedInApp/i,
  /\bLine\/\d/, // LINE
  /Pinterest/i,
  /; wv\)/, // Android WebView
];

/** True when the user agent belongs to an in-app browser or webview. */
export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim();
  if (!ua) return false;
  if (IN_APP_PATTERNS.some((re) => re.test(ua))) return true;
  // iOS WKWebView inside an app: every real iOS browser (Safari, Chrome,
  // Firefox, Edge) carries a "Safari/" token, embedded webviews do not.
  if (/\b(iPhone|iPad|iPod)\b/.test(ua) && !/Safari\//.test(ua)) return true;
  return false;
}

/** Whether "Doorgaan met Google" may be shown: the feature flag is on and
 * the visitor is not in an in-app browser. */
export function isGoogleSignInAllowed(input: {
  flag: string | null | undefined;
  userAgent: string | null | undefined;
}): boolean {
  return input.flag === "true" && !isInAppBrowser(input.userAgent);
}

export function normalizeAuthEmail(value: string): string {
  return value.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type EmailFieldError = "empty" | "invalid";

export function validateAuthEmail(value: string): EmailFieldError | null {
  const email = normalizeAuthEmail(value);
  if (!email) return "empty";
  if (!EMAIL_RE.test(email)) return "invalid";
  return null;
}

/** Keep digits only, at most AUTH_CODE_LENGTH (handles pasted "123 456"). */
export function sanitizeAuthCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, AUTH_CODE_LENGTH);
}

export function isNewAuthUser(
  createdAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  return now - created < NEW_USER_WINDOW_MS;
}

export type SendCodeFailure = "unknown_email" | "rate_limited" | "invalid_email" | "other";

/** Map a Supabase signInWithOtp error onto what the screen shows. */
export function classifySendCodeError(error: {
  code?: string | null;
  status?: number | null;
  message?: string | null;
}): SendCodeFailure {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  // shouldCreateUser: false and no account for this email.
  if (code === "otp_disabled" || message.includes("signups not allowed")) {
    return "unknown_email";
  }
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    error.status === 429 ||
    message.includes("rate limit") ||
    message.includes("security purposes")
  ) {
    return "rate_limited";
  }
  if (code === "email_address_invalid" || code === "validation_failed") {
    return "invalid_email";
  }
  return "other";
}

export type VerifyCodeFailure = "wrong_or_expired" | "rate_limited" | "other";

export function classifyVerifyCodeError(error: {
  code?: string | null;
  status?: number | null;
  message?: string | null;
}): VerifyCodeFailure {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (
    code === "otp_expired" ||
    message.includes("expired") ||
    message.includes("invalid")
  ) {
    return "wrong_or_expired";
  }
  if (code === "over_request_rate_limit" || error.status === 429) {
    return "rate_limited";
  }
  // Supabase answers a wrong code with 403 "Token has expired or is invalid".
  if (error.status === 403 || error.status === 401) return "wrong_or_expired";
  return "other";
}
