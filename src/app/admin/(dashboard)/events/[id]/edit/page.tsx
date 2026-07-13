import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventEditor } from "@/components/admin/EventEditor";
import { events } from "@/db/schema";
import { getDb } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import { getAllVenuesForAdmin } from "@/lib/venues";

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  const allVenues = await getAllVenuesForAdmin();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-burgundy">Tafel bewerken</h1>
        <Link
          href={adminPath(`/events/${event.id}/guests`)}
          prefetch={false}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Gasten ({event.spotsSold})
        </Link>
      </div>
      <EventEditor event={event} allVenues={allVenues} />
    </div>
  );
}
