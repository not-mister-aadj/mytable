import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EventGuestsView } from "@/components/admin/EventGuestsView";
import { events } from "@/db/schema";
import { getDb } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { getEventTicketsData } from "@/lib/event-tickets-data";

type Props = { params: Promise<{ id: string }> };

export default async function EventGuestsPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  const ticketsData = await getEventTicketsData(id);

  return (
    <EventGuestsView
      event={{
        id: event.id,
        nameNl: event.nameNl,
        city: event.city,
        startsAt: event.startsAt,
        spotsSold: event.spotsSold,
        capacity: event.capacity,
        slug: event.slug,
      }}
      tickets={ticketsData.tickets}
      transferTargets={ticketsData.transferTargets}
    />
  );
}
