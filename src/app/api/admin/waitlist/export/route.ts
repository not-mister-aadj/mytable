import { requireAdminApi } from "@/lib/admin-auth";
import {
  getWaitlistSignups,
  waitlistPeopleToExcelCsv,
  waitlistRowsToExcelCsv,
} from "@/lib/waitlist-data";
import { isDbConfigured } from "@/db/index";

export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const grouped = searchParams.get("grouped") === "1";
  const rows = await getWaitlistSignups();
  const csv = grouped
    ? waitlistPeopleToExcelCsv(rows)
    : waitlistRowsToExcelCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  const suffix = grouped ? "personen" : "rijen";

  return new Response(csv, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="mytable-wachtlijst-${suffix}-${date}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
