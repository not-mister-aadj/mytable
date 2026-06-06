import { requireAdmin } from "@/lib/admin-auth";
import { WaitlistView } from "@/components/admin/WaitlistView";
import { isDbConfigured } from "@/db/index";
import { getWaitlistSignups } from "@/lib/waitlist-data";

export default async function AdminWaitlistPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const signups = await getWaitlistSignups();

  return <WaitlistView signups={signups} />;
}
