import { EventEditor } from "@/components/admin/EventEditor";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllVenues } from "@/lib/venues";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function NewEventPage({ searchParams }: Props) {
  await requireAdmin();
  const { type } = await searchParams;
  const allVenues = await getAllVenues();
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">Nieuwe tafel</h1>
      <EventEditor allVenues={allVenues} initialType={type} />
    </div>
  );
}
