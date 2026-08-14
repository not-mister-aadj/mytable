import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { getWaitlistInsights } from "@/lib/waitlist-insights-data";
import { WaitlistInsightsView } from "@/components/admin/WaitlistInsightsView";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import {
  FORMAT_LABELS,
  GENDER_LABELS,
  AGE_LABELS,
  WHY_LABELS,
  COMPANY_LABELS,
  TABLE_TYPE_LABELS,
  VIBE_LABELS,
  BUDGET_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/priority-list-labels";

export default async function AdminWaitlistInsightsPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const insights = await getWaitlistInsights();

  return (
    <WaitlistInsightsView
      insights={insights}
      wachtlijstHref={adminPath("/priority-list", hostname)}
      labelMaps={{
        city: {},
        format: FORMAT_LABELS,
        gender: GENDER_LABELS,
        ageRange: AGE_LABELS,
        why: WHY_LABELS,
        company: COMPANY_LABELS,
        tableType: TABLE_TYPE_LABELS,
        vibe: VIBE_LABELS,
        budget: BUDGET_LABELS,
        experience: EXPERIENCE_LABELS,
      }}
    />
  );
}
