import { desc } from "drizzle-orm";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { EventsList } from "@/components/admin/EventsList";

export default async function AdminEventsPage() {
  await requireAdmin();
  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }
  const db = getDb();
  const rows = await db.select().from(events).orderBy(desc(events.startsAt));

  return <EventsList events={rows} />;
}
