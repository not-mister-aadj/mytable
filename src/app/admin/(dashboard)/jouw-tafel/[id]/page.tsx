import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FormatTabs } from "@/components/admin/FormatTabs";
import { JouwTafelBoard } from "@/components/admin/JouwTafelBoard";
import { isDbConfigured } from "@/db/index";
import { jouwTafelTablePath } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { loadEventBoard } from "@/lib/jouw-tafel/groups-server";

type Props = { params: Promise<{ id: string }> };

/** One Sunday Table: its venues, its groups and who sits where. */
export default async function AdminJouwTafelEventPage({ params }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const board = await loadEventBoard(id);
  if (!board) notFound();
  const month = board.event.startsAt.slice(0, 7);

  return (
    <div>
      <FormatTabs active="jouw-tafel-kalender" hostname={hostname} />
      <JouwTafelBoard
        board={board}
        calendarHref={adminPath(`/jouw-tafel/kalender?maand=${month}`, hostname)}
        tablePageHref={jouwTafelTablePath("nl", board.event.slug)}
      />
    </div>
  );
}
