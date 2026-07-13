import { EventEditor } from "@/components/admin/EventEditor";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllVenuesForAdmin } from "@/lib/venues";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function NewEventPage({ searchParams }: Props) {
  await requireAdmin();
  const { type } = await searchParams;
  let allVenues: Awaited<ReturnType<typeof getAllVenuesForAdmin>> = [];
  try {
    allVenues = await getAllVenuesForAdmin();
  } catch (error) {
    console.error("[admin/events/new] getAllVenues failed:", error);
  }
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">Nieuwe tafel</h1>
      <EventEditor allVenues={allVenues} initialType={type} />
    </div>
  );
}
