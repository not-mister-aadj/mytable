import { getLocalDevOrigin, getSiteUrl, isLocalDevHost } from "@/lib/admin-url";
import {
  accountPath,
  loginPath,
  type Locale,
} from "@/i18n/config";

export { accountPath, loginPath };

/**
 * OAuth callback for members — BeSquare-style `/auth/callback`.
 * Must be listed in Supabase Auth → Redirect URLs (path only; `next` is a query param).
 */
export function getMemberAuthCallbackUrl(origin?: string): string {
  const base = (origin ?? getSiteUrl()).replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  if (process.env.NODE_ENV === "development") {
    return `${getLocalDevOrigin()}/auth/callback`;
  }
  return `${base}/auth/callback`;
}

export function getBrowserMemberAuthCallbackUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return getMemberAuthCallbackUrl();
}

/** Safe post-login path on the marketing site only. */
export function sanitizeMemberNextPath(
  next: string | null | undefined,
  locale: Locale,
): string {
  const fallback = locale === "en" ? "/en/account" : "/account";
  if (!next) return fallback;
  if (next.startsWith("http://") || next.startsWith("https://")) {
    try {
      const url = new URL(next);
      const siteHost = new URL(getSiteUrl()).hostname;
      const wwwHost = siteHost.startsWith("www.")
        ? siteHost
        : `www.${siteHost}`;
      const apexHost = siteHost.replace(/^www\./, "");
      if (
        !isLocalDevHost(url.hostname) &&
        url.hostname !== siteHost &&
        url.hostname !== wwwHost &&
        url.hostname !== apexHost
      ) {
        return fallback;
      }
      return sanitizeMemberNextPath(url.pathname + url.search, locale);
    } catch {
      return fallback;
    }
  }
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (
    next.startsWith("/admin") ||
    next.startsWith("/dashboard") ||
    next.startsWith("/api")
  ) {
    return fallback;
  }
  return next;
}

export function getRequiredMemberAuthRedirectUrls(): string[] {
  const urls = [`${getLocalDevOrigin()}/auth/callback`];
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) {
    urls.push(`${site}/auth/callback`);
  }
  return urls;
}
