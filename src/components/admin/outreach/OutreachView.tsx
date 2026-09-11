"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { adminPath } from "@/lib/admin-url";
import {
  OUTREACH_STATUSES,
  OUTREACH_STATUS_LABELS,
  type OutreachStatus,
} from "@/lib/outreach/constants";
import type { OutreachProspectRow } from "@/lib/outreach/prospects-data";
import type { OutreachTemplateRow } from "@/lib/outreach/templates-data";
import {
  importProspectsCsvAction,
  sendSequenceAction,
} from "@/app/admin/(dashboard)/outreach/actions";
import { OutreachStatusPill } from "@/components/admin/outreach/OutreachStatusPill";
import { OutreachFunnelPanel } from "@/components/admin/outreach/OutreachFunnelPanel";
import { OutreachStepDots } from "@/components/admin/outreach/OutreachStepDots";
import { buildOutreachFunnel } from "@/lib/outreach/funnel";
import {
  VENUE_TYPES,
  VENUE_TYPE_LABELS,
  venueType,
  type VenueType,
} from "@/lib/outreach/venue-type";

type FilterKey = "all" | "todo" | "due" | "waiting" | "replied" | "won";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Alles" },
  { key: "todo", label: "Nog niet gemaild" },
  { key: "due", label: "Opvolgen" },
  { key: "waiting", label: "Wacht op antwoord" },
  { key: "replied", label: "Geantwoord" },
  { key: "won", label: "Partner" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function isDue(row: OutreachProspectRow): boolean {
  if (!row.nextFollowUpAt) return false;
  return new Date(row.nextFollowUpAt).getTime() <= Date.now();
}

function matchesFilter(row: OutreachProspectRow, filter: FilterKey): boolean {
  switch (filter) {
    case "todo":
      return row.messageCount === 0 && row.status === "new";
    case "due":
      return isDue(row);
    case "waiting":
      return row.status === "contacted" && !isDue(row);
    case "replied":
      return ["replied", "interested", "meeting"].includes(row.status);
    case "won":
      return row.status === "partner";
    default:
      return true;
  }
}

function MapPinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

type SortKey = "name" | "recent" | "engagement" | "due";

const SORT_LABELS: Record<SortKey, string> = {
  name: "Naam A–Z",
  recent: "Laatst gemaild",
  engagement: "Meeste reactie",
  due: "Opvolgen eerst",
};

function time(iso: string | null): number {
  return iso ? new Date(iso).getTime() : 0;
}

const SORTERS: Record<
  SortKey,
  (a: OutreachProspectRow, b: OutreachProspectRow) => number
> = {
  name: (a, b) => a.name.localeCompare(b.name, "nl"),
  recent: (a, b) => time(b.lastSentAt) - time(a.lastSentAt),
  // Antwoorden wegen zwaarder dan opens: dat is het signaal dat telt.
  engagement: (a, b) =>
    b.replyCount * 100 + b.openedCount - (a.replyCount * 100 + a.openedCount),
  due: (a, b) => {
    const aDue = a.nextFollowUpAt ? time(a.nextFollowUpAt) : Infinity;
    const bDue = b.nextFollowUpAt ? time(b.nextFollowUpAt) : Infinity;
    return aDue - bDue;
  },
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-burgundy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-wine/50">{hint}</p> : null}
    </div>
  );
}

export function OutreachView({
  prospects,
  templates,
  sendingDomainWarning,
}: {
  prospects: OutreachProspectRow[];
  templates: OutreachTemplateRow[];
  /** Set when outreach still goes out over the transactional domain. */
  sendingDomainWarning: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OutreachStatus>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | VenueType>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [csv, setCsv] = useState("");
  const [importCity, setImportCity] = useState("Rotterdam");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cities = useMemo(
    () => [...new Set(prospects.map((row) => row.city))].sort(),
    [prospects],
  );

  const typeCounts = useMemo(() => {
    const counts = new Map<VenueType, number>();
    for (const row of prospects) {
      const type = venueType(row.category);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return counts;
  }, [prospects]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = prospects.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (typeFilter !== "all" && venueType(row.category) !== typeFilter) {
        return false;
      }
      if (!query) return true;
      return [row.name, row.email, row.category, row.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
    return [...rows].sort(SORTERS[sort]);
  }, [prospects, filter, statusFilter, cityFilter, typeFilter, search, sort]);

  const sequenceLength = templates.filter(
    (template) => template.kind === "sequence" && template.isActive,
  ).length;

  /** The "what do I do next" numbers; the funnel below carries the rates. */
  const stats = useMemo(() => {
    const todo = prospects.filter(
      (row) => row.messageCount === 0 && row.status === "new" && row.email,
    );
    return {
      todo: todo.length,
      due: prospects.filter(isDue).length,
      noEmail: prospects.filter((row) => !row.email).length,
      replied: prospects.filter((row) => row.replyCount > 0).length,
    };
  }, [prospects]);

  const funnel = useMemo(
    () => buildOutreachFunnel(filtered, sequenceLength),
    [filtered, sequenceLength],
  );

  const selectable = filtered.filter((row) => Boolean(row.email));
  const allSelected =
    selectable.length > 0 && selectable.every((row) => selected.has(row.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((row) => row.id)));
  }

  function handleSend() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (
      !confirm(
        `Volgende stap versturen naar ${ids.length} ${ids.length === 1 ? "zaak" : "zaken"}?\n\nDit stuurt echte mail. Zaken die al de hele sequence hebben gehad worden overgeslagen.`,
      )
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await sendSequenceAction(ids);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const skipped = result.failures.length;
      setMessage(
        `${result.sent} verstuurd${skipped > 0 ? `, ${skipped} overgeslagen: ${result.failures
          .slice(0, 5)
          .map((failure) => `${failure.name} (${failure.reason})`)
          .join(", ")}${skipped > 5 ? "…" : ""}` : "."}`,
      );
      setSelected(new Set());
      router.refresh();
    });
  }

  function handleImport() {
    if (!csv.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await importProspectsCsvAction(csv, importCity);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `${result.imported} zaken geïmporteerd of bijgewerkt${result.skipped > 0 ? `, ${result.skipped} regels overgeslagen` : ""}.`,
      );
      setCsv("");
      setShowImport(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            MyTable
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Outreach
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Elke wijnbar en elk restaurant dat we benaderen, met wat er verstuurd
            is, of het geopend werd en wat ze antwoordden. Selecteer zaken en stuur
            de volgende stap van de sequence.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowImport((value) => !value)}
            className="inline-flex items-center justify-center rounded-full border border-burgundy/25 bg-cream px-5 py-2.5 text-sm font-medium text-burgundy transition hover:border-burgundy/50 hover:bg-burgundy/[0.04]"
          >
            Importeer CSV
          </button>
          <Link
            href={adminPath("/outreach/mails")}
            className="inline-flex items-center justify-center rounded-full border border-burgundy/25 bg-cream px-5 py-2.5 text-sm font-medium text-burgundy transition hover:border-burgundy/50 hover:bg-burgundy/[0.04]"
          >
            Verzonden mails
          </Link>
          <Link
            href={adminPath("/outreach/templates")}
            className="inline-flex items-center justify-center rounded-full border border-burgundy/25 bg-cream px-5 py-2.5 text-sm font-medium text-burgundy transition hover:border-burgundy/50 hover:bg-burgundy/[0.04]"
          >
            Templates ({templates.length})
          </Link>
        </div>
      </div>

      {sendingDomainWarning ? (
        <p className="rounded-2xl border border-gold/40 bg-gold/[0.1] px-5 py-4 text-sm text-[#7A5A2B]">
          {sendingDomainWarning}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-burgundy/20 bg-burgundy/[0.05] px-5 py-4 text-sm text-burgundy">
          {message}
        </p>
      ) : null}

      {showImport ? (
        <div className="space-y-3 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-sm text-wine/70">
            Plak de inhoud van een prospect-CSV (kolommen: naam, categorie, adres,
            google maps, website, email, telefoon, rating, reviews). Bestaande zaken
            worden bijgewerkt — status, sequence en notities blijven staan.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-wine/70">
              Stad
              <input
                value={importCity}
                onChange={(event) => setImportCity(event.target.value)}
                className="ml-2 rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              />
            </label>
            <span className="text-xs text-wine/50">
              Gebruikt als de CSV zelf geen stad-kolom heeft.
            </span>
          </div>
          <textarea
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            rows={8}
            placeholder='"naam","categorie","adres",…'
            className="w-full rounded-2xl border border-border-subtle bg-cream px-4 py-3 font-mono text-xs text-wine outline-none focus:border-burgundy/40"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={pending || !csv.trim()}
            className="inline-flex items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
          >
            {pending ? "Bezig…" : "Importeer"}
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Nog te mailen"
          value={String(stats.todo)}
          hint="met e-mailadres"
        />
        <StatCard
          label="Opvolgen nu"
          value={String(stats.due)}
          hint="wachttijd verstreken"
        />
        <StatCard
          label="Antwoorden"
          value={String(stats.replied)}
          hint="zaken die reageerden"
        />
        <StatCard
          label="Bellen"
          value={String(stats.noEmail)}
          hint="geen e-mailadres"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                filter === item.key
                  ? "border-burgundy/40 bg-burgundy/[0.06] text-burgundy"
                  : "border-border-subtle bg-cream text-wine hover:border-burgundy/40"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek op naam, e-mail of adres…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | VenueType)
              }
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Filter op type zaak"
            >
              <option value="all">Alle types</option>
              {VENUE_TYPES.filter((type) => typeCounts.has(type)).map((type) => (
                <option key={type} value={type}>
                  {VENUE_TYPE_LABELS[type]} ({typeCounts.get(type)})
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OutreachStatus)
              }
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Filter op status"
            >
              <option value="all">Alle statussen</option>
              {OUTREACH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {OUTREACH_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Filter op stad"
            >
              <option value="all">Alle steden</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Sorteer"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle/60 pt-4">
          <label className="flex items-center gap-2 text-sm text-wine/70">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-[#600D1E]"
            />
            Alles in filter ({selectable.length})
          </label>
          <button
            type="button"
            onClick={handleSend}
            disabled={pending || selected.size === 0}
            className="inline-flex items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
          >
            {pending
              ? "Bezig met versturen…"
              : `Verstuur volgende stap (${selected.size})`}
          </button>
          <span className="text-xs text-wine/50">
            {filtered.length} van {prospects.length} zaken
            {sequenceLength > 0 ? ` · sequence van ${sequenceLength} mails` : ""}
          </span>
        </div>
      </div>

      <OutreachFunnelPanel funnel={funnel} />

      <div className="divide-y divide-border-subtle/60 overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-wine/60">
            Geen zaken in dit filter. Importeer een CSV om te beginnen.
          </p>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
                disabled={!row.email}
                aria-label={`Selecteer ${row.name}`}
                className="h-4 w-4 shrink-0 accent-[#600D1E] disabled:opacity-30"
              />
              <Link
                href={adminPath(`/outreach/${row.id}`)}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium text-burgundy">
                  {row.name}
                </p>
                <p className="truncate text-xs text-wine/55">
                  {[row.category, row.email ?? "geen e-mail", row.city]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-3 text-xs text-wine/60">
                {/* Outside the row Link on purpose — an anchor inside an anchor
                    is invalid and the browser would swallow one of the two. */}
                {row.mapsUrl ? (
                  <a
                    href={row.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${row.name} op Google Maps`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-cream px-2.5 py-1 text-xs text-wine/65 transition hover:border-burgundy/40 hover:text-burgundy"
                  >
                    <MapPinIcon />
                    Maps
                  </a>
                ) : null}
                <OutreachStatusPill status={row.status} />
                <span
                  className="flex items-center gap-2"
                  title={`${row.sequenceStep} van ${sequenceLength || "?"} mails verstuurd`}
                >
                  <OutreachStepDots
                    steps={row.steps}
                    sequenceLength={sequenceLength}
                  />
                  <span className="text-wine/50">
                    {row.lastSentAt ? formatDate(row.lastSentAt) : "—"}
                  </span>
                </span>
                {row.openedCount > 0 ? (
                  <span className="text-burgundy" title="Geopende mails">
                    {row.openedCount}× open
                  </span>
                ) : null}
                {row.replyCount > 0 ? (
                  <span
                    className="rounded-full border border-gold/40 bg-gold/[0.12] px-2 py-0.5 font-medium text-[#7A5A2B]"
                    title="Geregistreerde antwoorden"
                  >
                    {row.replyCount}× antwoord
                  </span>
                ) : null}
                {row.bouncedCount > 0 ? (
                  <span className="text-red-700" title="Bounces">
                    bounce
                  </span>
                ) : null}
                {isDue(row) ? (
                  <span className="rounded-full border border-burgundy/30 bg-burgundy/[0.06] px-2 py-0.5 font-medium text-burgundy">
                    Opvolgen
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
