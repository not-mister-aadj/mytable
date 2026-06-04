import Link from "next/link";
import { VenueRow } from "@/components/admin/VenueRow";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllVenues } from "@/lib/venues";

export default async function AdminVenuesPage() {
  await requireAdmin();
  const rows = await getAllVenues();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl text-burgundy">Venues</h1>
        <Link
          href={adminPath("/venues/new")}
          className="inline-flex justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream"
        >
          + Nieuwe venue
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-subtle px-6 py-12 text-center text-wine/60">
            Nog geen restaurants of locaties. Voeg je eerste venue toe.
          </p>
        ) : (
          rows.map((v) => <VenueRow key={v.id} venue={v} />)
        )}
      </div>
    </div>
  );
}
