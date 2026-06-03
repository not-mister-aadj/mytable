import Link from "next/link";
import { adminPath } from "@/lib/admin-url";
import { desc } from "drizzle-orm";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminEventsPage() {
  await requireAdmin();
  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }
  const db = getDb();
  const rows = await db.select().from(events).orderBy(desc(events.startsAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-burgundy">Tafels</h1>
        <Link
          href={adminPath("/events/new")}
          className="rounded-full bg-burgundy px-5 py-2 text-sm text-cream"
        >
          Nieuwe tafel
        </Link>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-wine/60">
            <th className="py-2">Datum</th>
            <th>Stad</th>
            <th>Naam</th>
            <th>Status</th>
            <th>Bezetting</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-border-subtle/60">
              <td className="py-3">
                {new Date(e.startsAt).toLocaleString("nl-NL")}
              </td>
              <td>{e.city}</td>
              <td>{e.nameNl}</td>
              <td>
                <span
                  className={
                    e.workflowStatus === "published"
                      ? "text-green-800"
                      : "text-wine/50"
                  }
                >
                  {e.workflowStatus}
                </span>
              </td>
              <td>
                {e.spotsSold}/{e.capacity}
              </td>
              <td>
                <Link
                  href={adminPath(`/events/${e.id}/edit`)}
                  className="text-burgundy underline"
                >
                  Bewerken
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
