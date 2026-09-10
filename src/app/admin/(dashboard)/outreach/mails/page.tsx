import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { OutreachMailLog } from "@/components/admin/outreach/OutreachMailLog";
import { getOutreachMessageLog } from "@/lib/outreach/messages-data";

export default async function AdminOutreachMailsPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const messages = await getOutreachMessageLog();

  return <OutreachMailLog messages={messages} />;
}
