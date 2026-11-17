import { headers } from "next/headers";
import { EmailLogView } from "@/components/admin/EmailLogView";
import { MailCatalogView } from "@/components/admin/MailCatalogView";
import { MailsHeader } from "@/components/admin/MailsHeader";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveHostname } from "@/lib/admin-url";
import { getEmailLogList } from "@/lib/email/email-log";

/** Mails: every kind we send and when (Overzicht), and every mail that went out (Verstuurd). */
export default async function AdminEmailsPage({ searchParams }: { searchParams: Promise<{ tab?: string; soort?: string }> }) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const { tab, soort } = await searchParams;
  if (tab !== "verstuurd" && !soort) {
    return (
      <div className="space-y-6">
        <MailsHeader tab="overzicht" hostname={hostname} />
        <MailCatalogView hostname={hostname} />
      </div>
    );
  }

  const rows = await getEmailLogList();
  const initialKind = soort && rows.some((r) => r.kind === soort) ? soort : "all";
  return (
    <div className="space-y-6">
      <MailsHeader tab="verstuurd" hostname={hostname} />
      <EmailLogView rows={rows} initialKind={initialKind} />
    </div>
  );
}
