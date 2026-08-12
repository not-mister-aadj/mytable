import { requireAdmin } from "@/lib/admin-auth";
import { SundayTableDetailView } from "@/components/admin/SundayTableDetailView";
import { isDbConfigured } from "@/db/index";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import {
  saveSundayTableLocationAction,
  inviteWaitlistForSundayTableAction,
} from "@/app/admin/(dashboard)/sunday-tables/actions";
import {
  decodeSundayTableSlug,
  getSundayTableMembers,
} from "@/lib/sunday-table-signups-data";
import { getSundayTableLocation } from "@/lib/sunday-table-locations";
import { getWaitlistInviteStats } from "@/lib/sunday-table-waitlist-invites";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminSundayTableDetailPage({ params }: Props) {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const { slug } = await params;
  const table = decodeSundayTableSlug(slug);
  if (!table) notFound();

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const [members, location, waitlistStats] = await Promise.all([
    getSundayTableMembers(table),
    getSundayTableLocation(table),
    getWaitlistInviteStats(table),
  ]);

  return (
    <SundayTableDetailView
      table={table}
      members={members}
      listHref={adminPath("/sunday-tables", hostname)}
      customerBasePath={adminPath("/customers", hostname)}
      location={
        location
          ? {
              venueName: location.venueName,
              address: location.address,
              notes: location.notes,
            }
          : null
      }
      saveLocationAction={saveSundayTableLocationAction}
      waitlistStats={waitlistStats}
      inviteWaitlistAction={inviteWaitlistForSundayTableAction}
    />
  );
}
