import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { OutreachTemplatesView } from "@/components/admin/outreach/OutreachTemplatesView";
import {
  ensureDefaultOutreachTemplates,
  getOutreachTemplates,
} from "@/lib/outreach/templates-data";

export default async function AdminOutreachTemplatesPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  await ensureDefaultOutreachTemplates();
  const templates = await getOutreachTemplates();

  return <OutreachTemplatesView templates={templates} />;
}
