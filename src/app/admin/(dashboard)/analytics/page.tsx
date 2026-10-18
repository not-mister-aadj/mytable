import Link from "next/link";
import { headers } from "next/headers";
import { BoardView } from "@/components/admin/board/BoardView";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { currentMonth, getBoardData } from "@/lib/admin/board-data";
import { getPostHogGrowthDashboardUrl, isPostHogAdminConfigured } from "@/lib/posthog/config";

type Props = { searchParams: Promise<{ maand?: string }> };

/** Board: one month of MyTable for the founders and the board. */
export default async function AdminBoardPage({ searchParams }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const requested = (await searchParams).maand;
  const now = currentMonth();
  const month = requested && /^\d{4}-\d{2}$/.test(requested) && requested <= now ? requested : now;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();
  const monthHref = (m: string) => adminPath(`/analytics${m && m !== now ? `?maand=${m}` : ""}`, hostname);

  const data = await getBoardData(month);
  const posthogUrl = isPostHogAdminConfigured() ? getPostHogGrowthDashboardUrl() : null;

  return (
    <div className="space-y-8">
      <BoardView data={data} monthHref={monthHref} />
      {posthogUrl ? (
        <p className="no-print text-sm text-wine/60">
          Meer detail over bezoek en klikken:{" "}
          <Link href={posthogUrl} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
            PostHog dashboard
          </Link>
        </p>
      ) : null}
    </div>
  );
}
