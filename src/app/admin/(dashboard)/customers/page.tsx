import { requireAdmin } from "@/lib/admin-auth";
import { CustomersView } from "@/components/admin/CustomersView";
import { isDbConfigured } from "@/db/index";
import { getAdminCustomersPageData } from "@/lib/admin-customers-data";

// Campaign sends go out one by one with a short pause (up to 300 mails), so
// the server actions on this page need more than the default timeout.
export const maxDuration = 300;

export default async function AdminCustomersPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const data = await getAdminCustomersPageData();

  return <CustomersView data={data} />;
}
