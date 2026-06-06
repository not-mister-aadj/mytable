/** Public marketing site (agenda, checkout success URLs) */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
}

/** Origin for local dev (auth + admin links ignore production env). */
export function getLocalDevOrigin(): string {
  const configured = process.env.LOCAL_DEV_ORIGIN?.replace(/\/$/, "");
  if (configured) return configured;
  return "http://localhost:3001";
}

export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  return false;
}

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function usesAdminSubdomainFromEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "") ?? "";
  return Boolean(url && !url.endsWith("/admin"));
}

/** Resolve hostname from browser, request host header, or undefined (server fallback). */
export function resolveHostname(hostOrHostname?: string): string | undefined {
  if (hostOrHostname) {
    try {
      if (hostOrHostname.includes("://")) {
        return new URL(hostOrHostname).hostname;
      }
    } catch {
      // fall through
    }
    return hostOrHostname.split(":")[0].toLowerCase();
  }
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }
  return undefined;
}

/** Subdomain paths only on dashboard.mytable.club — never on localhost/LAN. */
export function usesAdminSubdomainOnHost(hostname: string): boolean {
  const host = resolveHostname(hostname) ?? hostname;
  if (isLocalDevHost(host)) return false;
  return isAdminHost(host) && usesAdminSubdomainFromEnv();
}

/** Client or server: subdomain admin only on the real admin host. */
export function usesAdminSubdomain(hostname?: string): boolean {
  const host = resolveHostname(hostname);
  if (host) return usesAdminSubdomainOnHost(host);
  if (isDevEnvironment()) return false;
  return usesAdminSubdomainFromEnv();
}

export function getLocalDevAdminUrl(): string {
  return `${getLocalDevOrigin()}/admin`;
}

/** Admin dashboard origin for redirects when host is unknown (env-based). */
export function getAdminUrl(): string {
  if (isDevEnvironment()) {
    return getLocalDevAdminUrl();
  }
  const configured = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return `${getSiteUrl().replace(/\/$/, "")}/admin`;
}

export function getAdminHost(): string {
  return (
    process.env.ADMIN_HOST ??
    process.env.NEXT_PUBLIC_ADMIN_HOST ??
    "dashboard.mytable.club"
  ).toLowerCase();
}

export function isAdminHost(hostname: string): boolean {
  return (resolveHostname(hostname) ?? hostname) === getAdminHost();
}

export function getOriginFromHost(host: string, proto = "https"): string {
  return `${proto}://${host}`;
}

export function adminUrlForHost(path: string, host: string, proto = "http"): string {
  const hostname = resolveHostname(host) ?? host.split(":")[0];
  return new URL(adminPath(path, hostname), getOriginFromHost(host, proto)).toString();
}

/**
 * Admin UI path for current host.
 * localhost → /admin/events · dashboard.mytable.club → /events
 */
export function adminPath(path: string, hostname?: string): string {
  const useSubdomain = usesAdminSubdomain(hostname);
  const raw = path.startsWith("/") ? path : `/${path}`;
  const qIndex = raw.indexOf("?");
  const pathname = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const search = qIndex >= 0 ? raw.slice(qIndex) : "";

  let result: string;
  if (useSubdomain) {
    if (pathname === "/admin" || pathname === "/admin/") {
      result = "/";
    } else if (pathname.startsWith("/admin/")) {
      result = pathname.slice("/admin".length) || "/";
    } else if (pathname === "/admin") {
      result = "/";
    } else {
      result = pathname;
    }
  } else if (pathname.startsWith("/admin")) {
    result = pathname;
  } else if (pathname === "/") {
    result = "/admin";
  } else {
    result = `/admin${pathname}`;
  }

  return `${result}${search}`;
}

/** Post-login destination path on the host that handled OAuth. */
export function adminPostLoginPath(hostname: string, next?: string | null): string {
  const host = resolveHostname(hostname) ?? hostname;
  const fallback = adminPath("/", host);
  if (!next) return fallback;
  if (next.startsWith("http://") || next.startsWith("https://")) {
    try {
      const url = new URL(next);
      return adminPath(url.pathname + url.search, url.hostname);
    } catch {
      return fallback;
    }
  }
  return adminPath(next, host);
}

export function adminPostLoginUrl(host: string, proto: string, next?: string | null): string {
  const hostname = resolveHostname(host) ?? host.split(":")[0];
  const path = adminPostLoginPath(hostname, next);
  return new URL(path, getOriginFromHost(host, proto)).toString();
}

/**
 * OAuth callback URL — must match Supabase Redirect URLs exactly (no query string).
 * Post-login destination is derived from the request host in /api/auth/callback.
 */
export function getAuthCallbackUrl(origin?: string): string {
  if (origin) {
    try {
      return `${new URL(origin).origin}/api/auth/callback`;
    } catch {
      // fall through
    }
  }

  if (isDevEnvironment()) {
    return `${getLocalDevOrigin()}/api/auth/callback`;
  }

  const adminBase = getAdminUrl().replace(/\/$/, "");
  return `${adminBase}/api/auth/callback`;
}

/** OAuth redirectTo for the current browser tab — exact Supabase allow-list match. */
export function getBrowserAuthCallbackUrl(): string {
  if (typeof window !== "undefined") {
    return getAuthCallbackUrl(window.location.origin);
  }
  return getAuthCallbackUrl();
}

/** Full admin URL (server fallback when request host is unknown). */
export function adminUrl(path: string): string {
  if (isDevEnvironment()) {
    return new URL(adminPath(path), getLocalDevOrigin()).toString();
  }
  return new URL(adminPath(path), getAdminUrl()).toString();
}

/** Allowed OAuth callback bases — document for Supabase setup. */
export function getRequiredAuthRedirectUrls(): string[] {
  const urls = [`${getLocalDevOrigin()}/api/auth/callback`];
  const adminConfigured = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "");
  if (adminConfigured) {
    urls.push(`${adminConfigured}/api/auth/callback`);
  }
  return urls;
}
