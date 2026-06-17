import { asc } from "drizzle-orm";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { reconcileAllEventSpotsSold } from "@/lib/reconcile-spots-sold";
import { syncPendingCheckoutsFromStripe } from "@/lib/stripe/sync-pending-checkouts";
import { EventsList } from "@/components/admin/EventsList";

export default async function AdminEventsPage() {
  await requireAdmin();
  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }
  const db = getDb();
  try {
    await syncPendingCheckoutsFromStripe();
  } catch (error) {
    console.error("[admin/events] pending checkout sync failed:", error);
  }
  try {
    await reconcileAllEventSpotsSold();
  } catch (error) {
    console.error("[admin/events] spots reconcile failed:", error);
  }
  const rows = await db.select().from(events).orderBy(asc(events.startsAt));

  return <EventsList events={rows} />;
}
