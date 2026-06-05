import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EventEditor } from "@/components/admin/EventEditor";
import { events } from "@/db/schema";
import { getDb } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { getEventTicketsData } from "@/lib/event-tickets-data";
import { getAllVenues } from "@/lib/venues";

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();
  const [allVenues, ticketsData] = await Promise.all([
    getAllVenues(),
    getEventTicketsData(id),
  ]);
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-burgundy">Tafel bewerken</h1>
      <EventEditor
        event={event}
        allVenues={allVenues}
        tickets={ticketsData.tickets}
        transferTargets={ticketsData.transferTargets}
      />
    </div>
  );
}
