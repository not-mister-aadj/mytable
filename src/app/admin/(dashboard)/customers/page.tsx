import { requireAdmin } from "@/lib/admin-auth";
import { CustomersView } from "@/components/admin/CustomersView";
import { isDbConfigured } from "@/db/index";
import { getAdminCustomersPageData } from "@/lib/admin-customers-data";

export default async function AdminCustomersPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const data = await getAdminCustomersPageData();

  return <CustomersView data={data} />;
}
