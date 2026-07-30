import { requireAdmin } from "@/lib/admin-auth";
import { SundayTablesAdminView } from "@/components/admin/SundayTablesAdminView";
import { isDbConfigured } from "@/db/index";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { getSundayTablesForAdmin } from "@/lib/sunday-table-signups-data";
import { headers } from "next/headers";

export default async function AdminSundayTablesPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const tables = await getSundayTablesForAdmin(4);

  return (
    <SundayTablesAdminView
      tables={tables}
      detailBasePath={adminPath("/sunday-tables", hostname)}
    />
  );
}
