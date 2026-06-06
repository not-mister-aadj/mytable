import { requireAdminApi } from "@/lib/admin-auth";
import {
  getWaitlistSignups,
  waitlistRowsToExcelCsv,
} from "@/lib/waitlist-data";
import { isDbConfigured } from "@/db/index";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  const rows = await getWaitlistSignups();
  const csv = waitlistRowsToExcelCsv(rows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="mytable-wachtlijst-${date}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
