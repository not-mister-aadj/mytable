import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { OutreachView } from "@/components/admin/outreach/OutreachView";
import { getOutreachProspects } from "@/lib/outreach/prospects-data";
import {
  ensureDefaultOutreachTemplates,
  getOutreachTemplates,
} from "@/lib/outreach/templates-data";
import { isOutreachDomainSeparate } from "@/lib/outreach/send";

export default async function AdminOutreachPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  await ensureDefaultOutreachTemplates();
  const [prospects, templates] = await Promise.all([
    getOutreachProspects(),
    getOutreachTemplates(),
  ]);

  const sendingDomainWarning = isOutreachDomainSeparate()
    ? null
    : "Let op: koude mail gaat nu over hetzelfde domein als je boekingsbevestigingen. Zet OUTREACH_EMAIL_FROM op een apart geverifieerd verzendsubdomein voordat je een grote batch stuurt.";

  return (
    <OutreachView
      prospects={prospects}
      templates={templates}
      sendingDomainWarning={sendingDomainWarning}
    />
  );
}
