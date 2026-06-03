export function useDbEvents(): boolean {
  return process.env.USE_DB_EVENTS === "true" && Boolean(process.env.DATABASE_URL);
}

export { getSiteUrl } from "@/lib/admin-url";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const list = getAdminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

export function getMaxSeatsPerOrder(): number {
  const n = Number.parseInt(process.env.MAX_SEATS_PER_ORDER ?? "4", 10);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export function showViewCount(): boolean {
  return process.env.SHOW_VIEW_COUNT === "true";
}
