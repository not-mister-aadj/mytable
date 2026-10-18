import { EmailLogView } from "@/components/admin/EmailLogView";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { getEmailLogList } from "@/lib/email/email-log";

/** Every email MyTable sent (email_log), with a preview of each. */
export default async function AdminEmailsPage() {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const rows = await getEmailLogList();
  return <EmailLogView rows={rows} />;
}
