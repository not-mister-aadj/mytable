import { requireAdmin } from "@/lib/admin-auth";
import { WaitlistView } from "@/components/admin/WaitlistView";
import { isDbConfigured } from "@/db/index";
import { getWaitlistSignups } from "@/lib/waitlist-data";
import { getWaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp.server";

export default async function AdminWaitlistPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const [signups, whatsappLinks] = await Promise.all([
    getWaitlistSignups(),
    getWaitlistWhatsappLinks(),
  ]);

  return <WaitlistView signups={signups} whatsappLinks={whatsappLinks} />;
}
