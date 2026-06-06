import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { CustomerProfileView } from "@/components/admin/CustomerProfileView";
import { isDbConfigured } from "@/db/index";
import { getAdminCustomerProfile } from "@/lib/admin-customers-data";
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
  const profile = await getAdminCustomerProfile(id);

  if (!profile) {
    notFound();
  }

  void captureServerEvent(id, PostHogEvents.customerProfileViewed, {
    paid_bookings_count: profile.paidBookingsCount,
    total_bookings: profile.totalBookings,
  });

  return <CustomerProfileView profile={profile} />;
}
