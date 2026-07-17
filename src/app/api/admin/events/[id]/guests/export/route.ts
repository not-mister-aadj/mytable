import { requireAdminApi } from "@/lib/admin-auth";
import {
  getEventGuestsExportData,
  guestRowsToExcelCsv,
} from "@/lib/event-tickets-data";
import { isDbConfigured } from "@/db/index";

function safeFilenamePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 48);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  const { id } = await context.params;
  const data = await getEventGuestsExportData(id);
  if (!data) {
    return new Response("Event not found", { status: 404 });
  }

  const csv = guestRowsToExcelCsv(data.rows);
  const eventDate = data.event.startsAt.slice(0, 10);
  const city = safeFilenamePart(data.event.city) || "event";
  const filename = `mytable-gasten-${city}-${eventDate}.xls`;

  return new Response(csv, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
