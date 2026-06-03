import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { events } from "@/db/schema";
import { getDb } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  return (
    <div>
      <h1 className="font-serif text-3xl text-burgundy">Tafel bewerken</h1>
      <div className="mt-8">
        <EventForm event={event} />
      </div>
    </div>
  );
}
