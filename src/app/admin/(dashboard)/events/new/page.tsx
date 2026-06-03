import { EventForm } from "@/components/admin/EventForm";
import { requireAdmin } from "@/lib/admin-auth";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-serif text-3xl text-burgundy">Nieuwe tafel</h1>
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
}
