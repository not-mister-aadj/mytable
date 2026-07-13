import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import { EventTicketsPanel } from "@/components/admin/EventTicketsPanel";
import { events } from "@/db/schema";
import { getDb } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import { getEventTicketsData } from "@/lib/event-tickets-data";
import { formatEventAdminListDate } from "@/lib/event-datetime-local";

type Props = { params: Promise<{ id: string }> };

export default async function EventGuestsPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  const ticketsData = await getEventTicketsData(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={adminPath("/events")}
            className="text-sm text-wine/60 hover:text-burgundy"
          >
            ← Terug naar tafels
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-burgundy">
            Gasten — {event.nameNl}
          </h1>
          <p className="mt-1 text-sm text-wine/70">
            {event.city} · {formatEventAdminListDate(new Date(event.startsAt))}
          </p>
        </div>
        <Link
          href={adminPath(`/events/${event.id}/edit`)}
          prefetch={false}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Tafel bewerken
        </Link>
      </div>

      <div className="max-w-md">
        <OccupancyBar sold={event.spotsSold} capacity={event.capacity} />
      </div>

      <EventTicketsPanel
        eventId={event.id}
        tickets={ticketsData.tickets}
        transferTargets={ticketsData.transferTargets}
        spotsSold={event.spotsSold}
        capacity={event.capacity}
      />
    </div>
  );
}
