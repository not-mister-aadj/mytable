import { VenueForm } from "@/components/admin/VenueForm";
import { requireAdmin } from "@/lib/admin-auth";

export default async function NewVenuePage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">Nieuwe venue</h1>
      <VenueForm />
    </div>
  );
}
