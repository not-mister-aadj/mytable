import { requireAdmin } from "@/lib/admin-auth";
import { PriorityListView } from "@/components/admin/PriorityListView";
import { isDbConfigured } from "@/db/index";
import { getPriorityListSignups } from "@/lib/priority-list-data";

export default async function AdminPriorityListPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const signups = await getPriorityListSignups();

  return <PriorityListView signups={signups} />;
}
