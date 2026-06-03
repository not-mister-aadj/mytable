import { notFound } from "next/navigation";
import { VenueForm } from "@/components/admin/VenueForm";
import { requireAdmin } from "@/lib/admin-auth";
import { getVenueById } from "@/lib/venues";

type Props = { params: Promise<{ id: string }> };

export default async function EditVenuePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">Venue bewerken</h1>
      <VenueForm venue={venue} />
    </div>
  );
}
