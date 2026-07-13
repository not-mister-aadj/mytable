import { requireAdminApi } from "@/lib/admin-auth";
import {
  getPriorityListSignups,
  priorityListRowsToExcelCsv,
} from "@/lib/priority-list-data";
import { isDbConfigured } from "@/db/index";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  const rows = await getPriorityListSignups();
  const csv = priorityListRowsToExcelCsv(rows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="mytable-priority-list-${date}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
