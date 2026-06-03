/** Public marketing site (agenda, checkout success URLs) */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
}

/** Admin dashboard origin, e.g. https://dashboard.mytable.club */
export function getAdminUrl(): string {
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
  return hostname.split(":")[0].toLowerCase() === getAdminHost();
}

/** True when admin lives on its own subdomain (not /admin on main site). */
export function usesAdminSubdomain(): boolean {
  const url = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "") ?? "";
  return Boolean(url && !url.endsWith("/admin"));
}

/**
 * Link/redirect path for admin UI.
 * Subdomain: /events — main site or localhost: /admin/events
 */
export function adminPath(path: string): string {
  const raw = path.startsWith("/") ? path : `/${path}`;
  const qIndex = raw.indexOf("?");
  const pathname = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const search = qIndex >= 0 ? raw.slice(qIndex) : "";

  let result: string;
  if (usesAdminSubdomain()) {
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

export function getAuthCallbackUrl(nextPath?: string): string {
  const base = usesAdminSubdomain()
    ? getAdminUrl()
    : getSiteUrl().replace(/\/$/, "");
  const next = encodeURIComponent(nextPath ?? adminPath("/"));
  return `${base}/api/auth/callback?next=${next}`;
}

/** Full URL for redirects (server). */
export function adminUrl(path: string): string {
  return new URL(adminPath(path), getAdminUrl()).toString();
}
