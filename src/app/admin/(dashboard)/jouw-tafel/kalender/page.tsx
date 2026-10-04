import { headers } from "next/headers";
import { JouwTafelCalendar } from "@/components/admin/JouwTafelCalendar";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { parseMonthKey } from "@/lib/jouw-tafel/groups-logic";
import { loadCalendarMonth } from "@/lib/jouw-tafel/groups-server";
import { amsterdamToday } from "@/lib/jouw-tafel/series-server";

type Props = { searchParams: Promise<{ maand?: string; stad?: string }> };

/** A month of "Jouw tafel" Sunday Tables, one block per table in its day. */
export default async function AdminJouwTafelCalendarPage({ searchParams }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const { maand, stad } = await searchParams;
  const today = amsterdamToday();
  const thisMonth = parseMonthKey(today.slice(0, 7))!;
  const current = parseMonthKey(maand) ?? thisMonth;
  const data = await loadCalendarMonth(current.year, current.month);
  const city = stad && data.cities.includes(stad) ? stad : null;

  return (
    <JouwTafelCalendar
      data={data}
      current={current}
      thisMonth={thisMonth}
      today={today}
      city={city}
      hostname={hostname}
      path={(p) => adminPath(p, hostname)}
    />
  );
}
