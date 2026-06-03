import { EventEditor } from "@/components/admin/EventEditor";
import { requireAdmin } from "@/lib/admin-auth";
export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">New experience</h1>
      <EventEditor />
    </div>
  );
}
