import { headers } from "next/headers";
import { EmailLogView } from "@/components/admin/EmailLogView";
import { MailChartsView } from "@/components/admin/MailChartsView";
import { MailListView, type MailListRow } from "@/components/admin/MailListView";
import { MailPlanView } from "@/components/admin/MailPlanView";
import { MailsHeader } from "@/components/admin/MailsHeader";
import { isDbConfigured } from "@/db/index";
import { EMAIL_PREVIEW_PATHS } from "@/lib/admin/email-stats";
import { INSIGHT_PERIODS, getMailListNumbers, type InsightPeriod } from "@/lib/admin/mail-insights";
import { getUpcomingMails } from "@/lib/admin/mail-overview";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveHostname } from "@/lib/admin-url";
import { getEmailLogList } from "@/lib/email/email-log";
import { MAIL_CATALOG } from "@/lib/email/mail-catalog";

type Props = { searchParams: Promise<{ tab?: string; soort?: string; periode?: string }> };

const day = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });

/** Mails: every kind we send (Alle mails), what went out (Verstuurd), what is coming (Gepland) and how it performs (Grafieken). */
export default async function AdminEmailsPage({ searchParams }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const { tab, soort, periode } = await searchParams;

  if (tab === "verstuurd" || (!tab && soort)) {
    const rows = await getEmailLogList();
    const initialKind = soort && rows.some((r) => r.kind === soort) ? soort : "all";
    return (
      <div className="space-y-6">
        <MailsHeader tab="verstuurd" hostname={hostname} />
        <EmailLogView rows={rows} initialKind={initialKind} />
      </div>
    );
  }

  if (tab === "gepland") {
    return (
      <div className="space-y-6">
        <MailsHeader tab="gepland" hostname={hostname} />
        <MailPlanView hostname={hostname} />
      </div>
    );
  }

  if (tab === "grafieken") {
    const period: InsightPeriod = INSIGHT_PERIODS.some((p) => p.id === periode) ? (periode as InsightPeriod) : "30";
    return (
      <div className="space-y-6">
        <MailsHeader tab="grafieken" hostname={hostname} />
        <MailChartsView period={period} hostname={hostname} />
      </div>
    );
  }

  // One after the other: the pool has 3 connections.
  const numbers = await getMailListNumbers();
  const upcoming = await getUpcomingMails();
  const rows: MailListRow[] = MAIL_CATALOG.map((mail) => {
    const n = numbers.get(mail.kind);
    const next = upcoming.find((u) => u.kind === mail.kind);
    return {
      kind: mail.kind,
      title: mail.title,
      goal: mail.goal,
      when: mail.when,
      auto: mail.auto,
      to: mail.to,
      sent: n?.sent ?? 0,
      opened: n?.opened ?? { part: 0, total: 0 },
      clicked: n?.clicked ?? { part: 0, total: 0 },
      booked: n?.booked ?? null,
      next: next
        ? [day.format(next.at).replace(/\./g, ""), next.sunday?.city, next.count].filter((v) => v !== null && v !== undefined).join(" · ")
        : null,
      samples: n?.samples ?? [],
      previewPath: EMAIL_PREVIEW_PATHS[mail.kind] ?? null,
      managePath: mail.managePath ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <MailsHeader tab="alle" hostname={hostname} />
      <MailListView rows={rows} />
    </div>
  );
}
