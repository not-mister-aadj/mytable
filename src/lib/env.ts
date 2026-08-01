/** True when published events should load from Postgres (server or client). */
export function isDbEventsEnabled(): boolean {
  const disabled =
    process.env.USE_DB_EVENTS === "false" ||
    process.env.NEXT_PUBLIC_USE_DB_EVENTS === "false";
  if (disabled) return false;

  const flagged =
    process.env.USE_DB_EVENTS === "true" ||
    process.env.NEXT_PUBLIC_USE_DB_EVENTS === "true";

  if (typeof window !== "undefined") {
    return flagged;
  }

  if (!process.env.DATABASE_URL) return false;

  // Production with a database always serves real events from the admin.
  if (process.env.NODE_ENV === "production") return true;

  return flagged;
}

/** Demo catalog only when developing locally without a database. */
export function shouldUseStaticCatalogFallback(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.DATABASE_URL;
}

/** Fall back to the static catalog when Postgres reads fail (dev, build, or outages). */
export function shouldUseCatalogOnDbError(): boolean {
  return true;
}

export { getSiteUrl } from "@/lib/admin-url";

const MYTABLE_STAFF_DOMAIN = "@mytable.club";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Staff/admin accounts must use the MyTable domain. */
export function isMyTableStaffEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(MYTABLE_STAFF_DOMAIN);
}

/**
 * Admin dashboard access: must be @mytable.club.
 * If ADMIN_EMAILS is set, the address must also be on that allowlist.
 */
export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!isMyTableStaffEmail(normalized)) return false;
  const list = getAdminEmails();
  if (list.length === 0) return true;
  return list.includes(normalized);
}

export function getMaxSeatsPerOrder(): number {
  const n = Number.parseInt(process.env.MAX_SEATS_PER_ORDER ?? "4", 10);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export function showViewCount(): boolean {
  return process.env.SHOW_VIEW_COUNT === "true";
}
