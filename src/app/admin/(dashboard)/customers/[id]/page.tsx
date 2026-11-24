import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { CustomerProfileView } from "@/components/admin/CustomerProfileView";
import { isDbConfigured } from "@/db/index";
import { getAdminCustomerProfile } from "@/lib/admin-customers-data";
import { getCustomerVisits } from "@/lib/venue-visits";
import {
  getCustomerSentEmails,
  getCustomerTablemates,
  getCustomerWaitlistAnswers,
} from "@/lib/admin-customer-profile-extras";
import { TableHistoryPanel } from "@/components/admin/TableHistoryPanel";
import { loadTableHistory } from "@/lib/admin/table-history";
import { InviteDeclinesPanel } from "@/components/admin/InviteDeclinesPanel";
import { InvitePausePanel } from "@/components/admin/InvitePausePanel";
import { citiesForEmail } from "@/lib/invites/cities";
import { upcomingDeclines } from "@/lib/invites/declines";
import { getInvitePause } from "@/lib/invites/pause";
import { MissedSundaysPanel } from "@/components/admin/MissedSundaysPanel";
import { loadMissedSundays } from "@/lib/missed-sundays/server";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerProfilePage({ params }: PageProps) {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const { id } = await params;
  const [profile, visits] = await Promise.all([
    getAdminCustomerProfile(id),
    getCustomerVisits(id),
  ]);

  if (!profile) {
    notFound();
  }

  const [waitlistAnswers, sentEmails, tablemates, history, invitePause, missed] = await Promise.all([
    getCustomerWaitlistAnswers(profile.id, profile.email),
    getCustomerSentEmails(profile.id, profile.email),
    getCustomerTablemates(profile.id, profile.email),
    loadTableHistory(),
    getInvitePause(profile.email),
    loadMissedSundays(profile.email),
  ]);
  const followed = (await citiesForEmail(profile.email)).filter((c) => invitePause.cityPrefs[c] !== "none");
  const declines = await upcomingDeclines(profile.email, followed);

  void captureServerEvent(id, PostHogEvents.customerProfileViewed, {
    paid_bookings_count: profile.paidBookingsCount,
    total_bookings: profile.totalBookings,
  });

  return (
    <CustomerProfileView
      profile={profile}
      visits={visits}
      waitlistAnswers={waitlistAnswers}
      sentEmails={sentEmails}
      tablemates={tablemates}
      tableHistory={
        <>
          <InvitePausePanel
            customerId={profile.id}
            email={profile.email}
            cityPrefs={invitePause.cityPrefs}
            pausedUntil={invitePause.pausedUntil}
          />
          <InviteDeclinesPanel
            customerId={profile.id}
            email={profile.email}
            rows={declines.map((d) => ({ eventId: d.eventId, city: d.city, startsAt: d.startsAt.toISOString(), declined: d.declined ? { source: d.declined.source } : null }))}
          />
          <MissedSundaysPanel customerId={profile.id} rows={missed.rows} />
          <TableHistoryPanel history={history} email={profile.email} />
        </>
      }
    />
  );
}
