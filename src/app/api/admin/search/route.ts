import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdminApi } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";

export type AdminSearchResult = { kind: "Persoon" | "Boeking" | "Zondag"; title: string; subtitle: string; href: string };

const dateFmt = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });

/** The admin search box (Ctrl+K): people by name or email, bookings by
 * MT code, Sundays by city or date. */
export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  if (!isDbConfigured()) return NextResponse.json({ results: [] });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const hostname = resolveHostname(host) ?? host.split(":")[0]?.toLowerCase();
  const href = (path: string) => adminPath(path, hostname);
  const like = `%${q.toLowerCase()}%`;
  const db = getDb();
  const results: AdminSearchResult[] = [];

  const code = q.toLowerCase().replace(/^mt/, "").replace(/[\s-]/g, "");
  if (/^[0-9a-f]{4,8}$/.test(code)) {
    const bookingRows = await db.execute<{ id: string; event_id: string; customer_name: string | null; email: string; city: string; starts_at: Date }>(sql`
      select b.id, b.event_id, b.customer_name, b.email, e.city, e.starts_at
      from bookings b join events e on e.id = b.event_id
      where replace(b.id::text, '-', '') like ${`${code}%`} and b.payment_status = 'paid'
      limit 5`);
    for (const b of bookingRows) {
      results.push({
        kind: "Boeking",
        title: `MT-${b.id.replace(/-/g, "").slice(0, 8).toUpperCase()} · ${b.customer_name?.trim() || b.email}`,
        subtitle: `${b.city}, ${dateFmt.format(new Date(b.starts_at))}`,
        href: href(`/events/${b.event_id}/guests`),
      });
    }
  }

  const people = await db.execute<{ id: string; first_name: string | null; last_name: string | null; email: string; paid: number }>(sql`
    select id, first_name, last_name, email, paid_bookings_count as paid
    from customers
    where lower(email) like ${like} or lower(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) like ${like}
    order by last_seen_at desc nulls last
    limit 6`);
  for (const c of people) {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
    results.push({
      kind: "Persoon",
      title: name || c.email,
      subtitle: `${name ? `${c.email} · ` : ""}${c.paid} ${c.paid === 1 ? "boeking" : "boekingen"}`,
      href: href(`/customers/${c.id}`),
    });
  }

  const sundays = await db.execute<{ id: string; city: string; starts_at: Date; name_nl: string; spots_sold: number; capacity: number }>(sql`
    select id, city, starts_at, name_nl, spots_sold, capacity
    from events
    where workflow_status <> 'cancelled'
      and (lower(city) like ${like} or lower(name_nl) like ${like}
        or lower(to_char(starts_at at time zone 'Europe/Amsterdam', 'FMDD FMMonth YYYY')) like ${like}
        or to_char(starts_at at time zone 'Europe/Amsterdam', 'DD-MM') = ${q})
    order by (starts_at < now()), abs(extract(epoch from (starts_at - now())))
    limit 6`);
  for (const e of sundays) {
    results.push({
      kind: "Zondag",
      title: `${e.city}, ${dateFmt.format(new Date(e.starts_at))}`,
      subtitle: `${e.name_nl} · ${e.spots_sold}/${e.capacity}`,
      href: href(`/events/${e.id}/guests`),
    });
  }

  return NextResponse.json({ results: results.slice(0, 14) });
}
