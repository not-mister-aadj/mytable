import { eq, gte, and, gt, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { headers } from "next/headers";
import { adminPath } from "@/lib/admin-url";
import { bookings, events, waitlistSignups } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/event-display";

export default async function AdminDashboardPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p className="text-wine/70">DATABASE_URL ontbreekt. Zie .env.example.</p>;
  }

  const db = getDb();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3001";
  const hostname = host.split(":")[0].toLowerCase();

  const [revenue] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.amountCents}), 0)`,
    })
    .from(bookings)
    .where(
      and(eq(bookings.paymentStatus, "paid"), gte(bookings.createdAt, weekAgo)),
    );

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(eq(bookings.paymentStatus, "paid"), gte(bookings.createdAt, weekAgo)),
    );

  const now = new Date();

  const [publishedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(eq(events.workflowStatus, "published"));

  const upcoming = await db
    .select()
    .from(events)
    .where(
      and(eq(events.workflowStatus, "published"), gt(events.startsAt, now)),
    )
    .orderBy(events.startsAt)
    .limit(5);

  const [waitlistTotal] = await db
    .select({ count: sql<number>`count(distinct ${waitlistSignups.email})::int` })
    .from(waitlistSignups);

  const [waitlistThisWeek] = await db
    .select({ count: sql<number>`count(distinct ${waitlistSignups.email})::int` })
    .from(waitlistSignups)
    .where(gte(waitlistSignups.createdAt, weekAgo));

  const recentWaitlist = await db
    .select({
      email: waitlistSignups.email,
      name: waitlistSignups.name,
      city: waitlistSignups.city,
      createdAt: waitlistSignups.createdAt,
    })
    .from(waitlistSignups)
    .orderBy(desc(waitlistSignups.createdAt))
    .limit(5);

  const priorityListHref = adminPath("/priority-list", hostname);

  return (
    <div>
      <h1 className="font-serif text-3xl text-burgundy">Dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Wachtlijst totaal"
          value={String(waitlistTotal?.count ?? 0)}
          href={priorityListHref}
        />
        <Stat
          label="Wachtlijst (7 dagen)"
          value={String(waitlistThisWeek?.count ?? 0)}
          href={priorityListHref}
        />
        <Stat
          label="Betaalde boekingen (7d)"
          value={String(bookingCount?.count ?? 0)}
        />
        <Stat
          label="Omzet (7 dagen)"
          value={`€${((revenue?.total ?? 0) / 100).toFixed(2)}`}
        />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-burgundy">
            Recente wachtlijst-aanmeldingen
          </h2>
          <Link
            href={priorityListHref}
            className="text-sm text-burgundy underline"
          >
            Bekijk alles
          </Link>
        </div>
        {recentWaitlist.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-4 py-6 text-center text-sm text-wine/60">
            Nog geen aanmeldingen.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-beige">
            {recentWaitlist.map((row) => (
              <li
                key={`${row.email}-${row.city}`}
                className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span>
                  {row.name ?? row.email}
                  <span className="text-wine/60"> · {row.city}</span>
                </span>
                <span className="text-wine/50">
                  {new Intl.DateTimeFormat("nl-NL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(row.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-burgundy">
            Aankomende tafels{" "}
            <span className="text-sm font-normal text-wine/50">
              ({publishedCount?.count ?? 0} gepubliceerd)
            </span>
          </h2>
          <Link
            href={adminPath("/events/new", hostname)}
            className="text-sm text-burgundy underline"
          >
            Nieuwe tafel
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-4 py-6 text-center text-sm text-wine/60">
            Geen aankomende, gepubliceerde tafels.
          </p>
        ) : (
        <ul className="mt-4 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-beige">
          {upcoming.map((e) => {
            const editHref = adminPath(`/events/${e.id}/edit`, hostname);

            return (
            <li
              key={e.id}
              className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span>
                {e.nameNl} · {e.city}
                <span className="text-wine/60">
                  {" "}
                  ·{" "}
                  {formatDateTime(
                    new Date(e.startsAt),
                    e.endsAt ? new Date(e.endsAt) : null,
                    "nl",
                  )}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-wine/60">
                  {e.spotsSold}/{e.capacity}
                </span>
                <Link
                  href={editHref}
                  prefetch={false}
                  className="rounded-full border border-border-subtle bg-cream px-3.5 py-1.5 text-sm font-medium text-burgundy transition hover:border-burgundy/30"
                >
                  Bewerken
                </Link>
              </div>
            </li>
            );
          })}
        </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm text-wine/60">{label}</p>
      <p className="mt-1 font-serif text-2xl text-burgundy">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-border-subtle bg-beige p-5 transition hover:border-burgundy/30 hover:bg-cream/60"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-beige p-5">
      {content}
    </div>
  );
}
