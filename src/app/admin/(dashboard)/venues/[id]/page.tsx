import Link from "next/link";
import { notFound } from "next/navigation";
import { isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { getVenueById } from "@/lib/venues";
import { getVenueVisits } from "@/lib/venue-visits";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl text-burgundy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-wine/50">{hint}</p> : null}
    </div>
  );
}

function WhenPill({ happened }: { happened: boolean }) {
  return happened ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
      geweest
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
      gepland
    </span>
  );
}

export default async function AdminVenueDetailPage({ params }: Props) {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  const { totals, buyers, events } = await getVenueVisits(id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={adminPath("/venues")}
            className="text-sm text-wine/55 transition hover:text-burgundy"
          >
            ← Alle venues
          </Link>
          <h1 className="mt-3 font-serif text-3xl text-burgundy sm:text-4xl">
            {venue.name}
          </h1>
          <p className="mt-2 text-sm text-wine/65">
            {venue.city}
            {venue.area ? ` · ${venue.area}` : ""}
            {venue.address ? ` · ${venue.address}` : ""}
          </p>
        </div>
        <Link
          href={adminPath(`/venues/${venue.id}/edit`)}
          className="inline-flex justify-center self-start rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Bewerken
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Events"
          value={String(totals.events)}
          hint={`${totals.happened.events} geweest · ${totals.upcoming.events} gepland`}
        />
        <KpiCard
          label="Gasten"
          value={String(totals.guests)}
          hint={`${totals.happened.guests} geweest · ${totals.upcoming.guests} gepland`}
        />
        <KpiCard label="Kopers" value={String(totals.uniqueBuyers)} />
        <KpiCard
          label="Terugkerend"
          value={String(totals.returningBuyers)}
          hint="Kopers met 2+ events hier"
        />
        <KpiCard label="+1's" value={String(totals.plusOnes)} />
      </div>

      <p className="text-sm text-wine/55">
        Telt betaalde, actieve boekingen van events die aan deze venue gekoppeld
        zijn. Een +1 telt mee als gast, maar staat bij de koper.
      </p>

      <section className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
          Kopers
        </h2>
        {buyers.length === 0 ? (
          <p className="mt-4 text-sm text-wine/60">
            Nog niemand geweest of ingeschreven.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 text-xs uppercase tracking-[0.06em] text-wine/50">
                  <th className="py-2 pr-4">Naam</th>
                  <th className="py-2 pr-4">Events</th>
                  <th className="py-2 pr-4">Plekken</th>
                  <th className="py-2 pr-4">+1</th>
                  <th className="py-2 pr-4">Eerste keer</th>
                  <th className="py-2">Laatste keer</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr
                    key={b.customerId ?? b.email}
                    className="border-b border-border-subtle/40 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      {b.customerId ? (
                        <Link
                          href={adminPath(`/customers/${b.customerId}`)}
                          className="font-medium text-wine hover:text-burgundy hover:underline"
                        >
                          {b.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-wine">{b.name}</span>
                      )}
                      <p className="text-xs text-wine/50">{b.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-wine/80">
                      {b.events}
                      <p className="text-xs text-wine/50">
                        {b.happenedEvents} geweest
                        {b.upcomingEvents > 0
                          ? ` · ${b.upcomingEvents} gepland`
                          : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-wine/80">{b.seats}</td>
                    <td className="py-3 pr-4 text-wine/80">
                      {b.plusOnes > 0 ? (
                        <>
                          {b.plusOnes}
                          {b.plusOneNames.length > 0 ? (
                            <p className="text-xs text-wine/50">
                              {b.plusOneNames.join(", ")}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 pr-4 text-wine/70">
                      {formatDate(b.firstVisit)}
                    </td>
                    <td className="py-3 text-wine/70">
                      {formatDate(b.lastVisit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
          Events
        </h2>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-wine/60">
            Nog geen events met gasten op deze locatie.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 text-xs uppercase tracking-[0.06em] text-wine/50">
                  <th className="py-2 pr-4">Datum</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Gasten</th>
                  <th className="py-2 pr-4">Kopers</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e.eventId}
                    className="border-b border-border-subtle/40 last:border-0"
                  >
                    <td className="py-3 pr-4 text-wine/70">
                      {formatDate(e.startsAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={adminPath(`/events/${e.eventId}/edit`)}
                        className="font-medium text-wine hover:text-burgundy hover:underline"
                      >
                        {e.eventName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-wine/80">{e.guests}</td>
                    <td className="py-3 pr-4 text-wine/80">{e.buyers}</td>
                    <td className="py-3">
                      <WhenPill happened={e.happened} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
