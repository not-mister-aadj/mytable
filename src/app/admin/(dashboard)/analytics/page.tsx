import { AnalyticsView } from "@/components/admin/AnalyticsView";
import { requireAdmin } from "@/lib/admin-auth";
import { getAnalyticsSummary } from "@/lib/posthog/admin-stats";
import { getConceptStats } from "@/lib/signup-concept-data";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const [summary, concepts] = await Promise.all([
    getAnalyticsSummary(),
    getConceptStats().catch((error: unknown) => {
      console.error("[admin analytics] concept stats failed", error);
      return null;
    }),
  ]);

  return <AnalyticsView summary={summary} concepts={concepts} />;
}
