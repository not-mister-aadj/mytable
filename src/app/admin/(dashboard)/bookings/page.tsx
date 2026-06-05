import { requireAdmin } from "@/lib/admin-auth";
import { getAdminBookingsPageData } from "@/lib/admin-bookings-data";
import { isDbConfigured } from "@/db/index";
import { BookingsOperationsView } from "@/components/admin/bookings/BookingsOperationsView";

export default async function AdminBookingsPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const data = await getAdminBookingsPageData();

  return <BookingsOperationsView data={data} />;
}
