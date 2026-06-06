import { AnalyticsView } from "@/components/admin/AnalyticsView";
import { requireAdmin } from "@/lib/admin-auth";
import { getAnalyticsSummary } from "@/lib/posthog/admin-stats";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const summary = await getAnalyticsSummary();

  return <AnalyticsView summary={summary} />;
}
