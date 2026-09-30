import { requireAdmin } from "@/lib/admin-auth";
import { SundayTableDetailView } from "@/components/admin/SundayTableDetailView";
import { isDbConfigured } from "@/db/index";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import {
  saveSundayTableLocationAction,
  inviteWaitlistForSundayTableAction,
  openTicketSalesAction,
} from "@/app/admin/(dashboard)/sunday-tables/actions";
import { SIGNUPS_PAUSED } from "@/app/admin/(dashboard)/sunday-tables/signups-paused";
import {
  decodeSundayTableSlug,
  getSundayTableMembers,
} from "@/lib/sunday-table-signups-data";
import { getSundayTableLocation } from "@/lib/sunday-table-locations";
import { getWaitlistInviteStats } from "@/lib/sunday-table-waitlist-invites";
import { findSundayTableTicketEvent } from "@/lib/sunday-table-ticket-event";
import { getUnnotifiedEventSignups } from "@/lib/event-notify-signups";
import { getAllVenuesForAdmin } from "@/lib/venues";
import { getEventVenueIds } from "@/lib/event-venues";
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

  const [members, location, waitlistStats, ticketEvent, allVenues] =
    await Promise.all([
      getSundayTableMembers(table),
      getSundayTableLocation(table),
      getWaitlistInviteStats(table),
      findSundayTableTicketEvent(table),
      getAllVenuesForAdmin(),
    ]);

  // The venue picker: venues in this table's city, plus whichever venue the
  // ticket event is linked to now (even if its city is spelled differently).
  const linkedVenueId = ticketEvent
    ? ((await getEventVenueIds(ticketEvent.id))[0] ?? null)
    : null;
  const cityKey = table.city.trim().toLowerCase();
  const venueOptions = allVenues
    .filter(
      (v) => v.city.trim().toLowerCase() === cityKey || v.id === linkedVenueId,
    )
    .map((v) => ({ id: v.id, name: v.name, address: v.address ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const comingSoon = Boolean(ticketEvent?.extras?.comingSoon);
  const notifySignupCount = comingSoon
    ? (await getUnnotifiedEventSignups(ticketEvent!.id)).length
    : 0;

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
      venueOptions={venueOptions}
      linkedVenueId={linkedVenueId}
      hasTicketEvent={Boolean(ticketEvent)}
      waitlistStats={waitlistStats}
      inviteWaitlistAction={inviteWaitlistForSundayTableAction}
      signupsPaused={SIGNUPS_PAUSED}
      comingSoon={comingSoon}
      notifySignupCount={notifySignupCount}
      openTicketSalesAction={openTicketSalesAction}
    />
  );
}
