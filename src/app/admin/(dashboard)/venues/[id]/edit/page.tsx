import { notFound } from "next/navigation";
import { VenueForm } from "@/components/admin/VenueForm";
import { requireAdmin } from "@/lib/admin-auth";
import { getVenueById } from "@/lib/venues";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditVenuePage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">Venue bewerken</h1>
      {saved ? (
        <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          Opgeslagen.
        </p>
      ) : null}
      <VenueForm venue={venue} />
    </div>
  );
}
