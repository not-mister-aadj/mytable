import { requireAdminApi } from "@/lib/admin-auth";
import {
  getAdminMembersPageData,
  membersRowsToExcelCsv,
} from "@/lib/admin-members-data";
import { isDbConfigured } from "@/db/index";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new Response("Supabase admin not configured", { status: 503 });
  }

  const data = await getAdminMembersPageData();
  const csv = membersRowsToExcelCsv(data.members);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="mytable-members-${date}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
