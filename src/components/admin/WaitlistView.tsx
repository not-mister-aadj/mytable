"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { removeWaitlistSignupAction } from "@/app/admin/(dashboard)/waitlist/actions";
import type {
  WaitlistInterestId,
  WaitlistTableTypeId,
} from "@/i18n/waitlist-page.types";
import type { WaitlistSignupRow } from "@/lib/waitlist-data";
import {
  computeWaitlistAdminStats,
  groupWaitlistPeople,
  type WaitlistCountItem,
  type WaitlistPerson,
} from "@/lib/waitlist-admin-stats";
import {
  INTEREST_LABELS,
  TABLE_TYPE_LABELS,
  formatWaitlistPreferenceLabels,
  joinPreferenceLabels,
} from "@/lib/waitlist-preference-labels";
import type { WaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp";
import { WaitlistWhatsappLinksForm } from "./WaitlistWhatsappLinksForm";

type TabId = "dashboard" | "list" | "whatsapp";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-beige/60 p-5 shadow-[0_8px_24px_rgba(43,13,18,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-burgundy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-wine/50">{hint}</p> : null}
    </div>
  );
}

function BreakdownChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: WaitlistCountItem[];
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/70 p-5 sm:p-6">
      <h3 className="font-serif text-xl text-burgundy">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-wine/55">{subtitle}</p>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-wine/45">Nog geen quiz-data.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-wine">{item.label}</span>
                <span className="tabular-nums text-wine/60">
                  {item.count}
                  <span className="ml-2 text-wine/40">
                    {Math.round(item.share * 100)}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-wine/8">
                <div
                  className="h-full rounded-full bg-burgundy/85"
                  style={{
                    width: `${Math.max(6, (item.count / max) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CompactMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex max-w-full items-baseline gap-1.5">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-wine/40">
        {label}
      </span>
      <span className="truncate text-wine/80">{value || "—"}</span>
    </span>
  );
}

function PersonRow({
  person,
  removing,
  onRemove,
}: {
  person: WaitlistPerson;
  removing: boolean;
  onRemove: () => void;
}) {
  const labels = formatWaitlistPreferenceLabels(person.preferences);

  return (
    <li className="rounded-xl border border-border-subtle/70 bg-beige/40 px-3.5 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-medium text-wine">
              {person.name?.trim() || "Geen naam"}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                person.hasQuiz
                  ? "bg-burgundy/10 text-burgundy"
                  : "bg-wine/8 text-wine/45"
              }`}
            >
              {person.hasQuiz ? "Quiz" : "E-mail"}
            </span>
            <span className="text-xs uppercase tracking-[0.08em] text-wine/40">
              {person.locale}
            </span>
            <span className="text-xs text-wine/40">
              {formatDate(person.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-wine/60">{person.email}</p>
          <div className="mt-2 grid gap-0.5 text-sm sm:grid-cols-2">
            <CompactMeta
              label="Ervaring"
              value={joinPreferenceLabels(labels.interests)}
            />
            <CompactMeta
              label="Waarom"
              value={joinPreferenceLabels(labels.why)}
            />
            <CompactMeta
              label="Gezelschap"
              value={joinPreferenceLabels(labels.company)}
            />
            <CompactMeta
              label="Tafel"
              value={joinPreferenceLabels(labels.tableType)}
            />
            <CompactMeta
              label="Steden"
              value={joinPreferenceLabels(person.cities)}
            />
            <CompactMeta
              label="Flexibel"
              value={labels.regionFlexible ? "Ja" : "Nee"}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`${person.name ?? person.email} verwijderen`}
          title="Verwijderen"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-cream text-wine/55 transition hover:border-red-800/35 hover:bg-red-50 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CloseIcon />
        </button>
      </div>
    </li>
  );
}

export function WaitlistView({
  signups: initialSignups,
  whatsappLinks,
}: {
  signups: WaitlistSignupRow[];
  whatsappLinks: WaitlistWhatsappLinks;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [signups, setSignups] = useState(initialSignups);
  const [cityFilter, setCityFilter] = useState("all");
  const [interestFilter, setInterestFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [quizFilter, setQuizFilter] = useState<"all" | "quiz" | "email">("all");
  const [search, setSearch] = useState("");
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  useEffect(() => {
    setSignups(initialSignups);
  }, [initialSignups]);

  const people = useMemo(() => groupWaitlistPeople(signups), [signups]);
  const stats = useMemo(() => computeWaitlistAdminStats(people), [people]);

  async function handleRemove(person: WaitlistPerson) {
    const label = person.name?.trim() || person.email;
    const cities =
      person.cities.length > 0
        ? `\n\nSteden: ${person.cities.join(", ")}`
        : "";
    if (
      !confirm(
        `Weet je zeker dat je ${label} van de wachtlijst wilt halen?${cities}\n\nDit kan niet ongedaan worden gemaakt.`,
      )
    ) {
      return;
    }

    setRemovingEmail(person.email);
    const result = await removeWaitlistSignupAction(person.email);
    setRemovingEmail(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    setSignups((current) =>
      current.filter(
        (row) => row.email.toLowerCase() !== person.email.toLowerCase(),
      ),
    );
    router.refresh();
  }

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const person of people) {
      for (const city of person.cities) set.add(city);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "nl"));
  }, [people]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((person) => {
      if (cityFilter !== "all" && !person.cities.includes(cityFilter)) {
        return false;
      }
      if (
        interestFilter !== "all" &&
        !(person.preferences?.interests ?? []).includes(
          interestFilter as WaitlistInterestId,
        )
      ) {
        return false;
      }
      if (
        tableFilter !== "all" &&
        !(person.preferences?.tableType ?? []).includes(
          tableFilter as WaitlistTableTypeId,
        )
      ) {
        return false;
      }
      if (quizFilter === "quiz" && !person.hasQuiz) return false;
      if (quizFilter === "email" && person.hasQuiz) return false;
      if (!q) return true;
      const labels = formatWaitlistPreferenceLabels(person.preferences);
      const haystack = [
        person.email,
        person.name ?? "",
        joinPreferenceLabels(person.cities),
        joinPreferenceLabels(labels.interests),
        joinPreferenceLabels(labels.why),
        joinPreferenceLabels(labels.company),
        joinPreferenceLabels(labels.tableType),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    people,
    cityFilter,
    interestFilter,
    tableFilter,
    quizFilter,
    search,
  ]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "list", label: "Aanmeldingen" },
    { id: "whatsapp", label: "WhatsApp" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            Marketing
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Wachtlijst
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Beslis waar je als volgende tafels opent: vraag, steden en
            tafeltype in één overzicht.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/waitlist/export?grouped=1"
            className="inline-flex items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
          >
            Export personen
          </a>
          <a
            href="/api/admin/waitlist/export"
            className="inline-flex items-center justify-center rounded-full border border-burgundy/25 bg-cream px-5 py-2.5 text-sm font-medium text-burgundy transition hover:border-burgundy/40 hover:bg-beige"
          >
            Export rijen
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle/80 bg-cream/70 p-1.5">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-burgundy text-cream shadow-sm"
                  : "text-wine/70 hover:bg-burgundy/[0.06] hover:text-burgundy"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Personen"
              value={stats.people}
              hint={`${stats.withQuiz} met quiz · ${stats.withoutQuiz} alleen e-mail`}
            />
            <StatCard
              label="Laatste 7 dagen"
              value={stats.last7d}
              hint={`${stats.last30d} in 30 dagen`}
            />
            <StatCard
              label="Top ervaring"
              value={stats.interests[0]?.label ?? "—"}
              hint={
                stats.interests[0]
                  ? `${stats.interests[0].count} × · ${Math.round(stats.interests[0].share * 100)}%`
                  : "Nog geen quiz-keuzes"
              }
            />
            <StatCard
              label="Top stad"
              value={stats.cities[0]?.label ?? "—"}
              hint={
                stats.cities[0]
                  ? `${stats.cities[0].count} mensen`
                  : "Nog geen steden"
              }
            />
          </div>

          {stats.insights.length > 0 ? (
            <section className="rounded-2xl border border-rose/20 bg-gradient-to-br from-rose-soft/50 via-cream to-beige p-5 sm:p-6">
              <h2 className="font-serif text-xl text-burgundy">
                Beslissignalen
              </h2>
              <ul className="mt-4 space-y-2.5">
                {stats.insights.map((insight) => (
                  <li
                    key={insight}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-wine/80"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy"
                    />
                    {insight}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownChart
              title="Ervaringen"
              subtitle="Waar vraag naartoe gaat — open hier eerst."
              items={stats.interests}
            />
            <BreakdownChart
              title="Steden"
              subtitle="Waar mensen een tafel zoeken."
              items={stats.cities}
            />
            <BreakdownChart
              title="Waarom"
              subtitle="Koopmotieven uit de quiz."
              items={stats.why}
            />
            <BreakdownChart
              title="Hoe komen"
              subtitle="Solo, vrienden of nieuwe mensen."
              items={stats.company}
            />
            <BreakdownChart
              title="Type tafel"
              subtitle="Girls only vs gemengd."
              items={stats.tableType}
            />
            <section className="rounded-2xl border border-border-subtle/80 bg-cream/70 p-5 sm:p-6">
              <h3 className="font-serif text-xl text-burgundy">
                Flexibiliteit
              </h3>
              <p className="mt-1 text-sm text-wine/55">
                Open voor een stad in de buurt.
              </p>
              <p className="mt-6 font-serif text-4xl text-burgundy">
                {stats.withQuiz > 0
                  ? `${Math.round((stats.regionFlexible / stats.withQuiz) * 100)}%`
                  : "—"}
              </p>
              <p className="mt-2 text-sm text-wine/60">
                {stats.regionFlexible} van {stats.withQuiz} quiz-aanmeldingen
              </p>
            </section>
          </div>
        </div>
      ) : null}

      {tab === "list" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border-subtle/80 bg-cream/60 p-4">
            <div className="grid gap-2.5 lg:grid-cols-[1fr_repeat(4,minmax(0,10.5rem))]">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek naam, e-mail, stad, antwoord…"
                className="w-full rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
              />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
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
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
                aria-label="Filter op ervaring"
              >
                <option value="all">Alle ervaringen</option>
                {Object.entries(INTEREST_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
                aria-label="Filter op type tafel"
              >
                <option value="all">Alle tafels</option>
                {Object.entries(TABLE_TYPE_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={quizFilter}
                onChange={(e) =>
                  setQuizFilter(e.target.value as "all" | "quiz" | "email")
                }
                className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
                aria-label="Filter op quiz"
              >
                <option value="all">Quiz + e-mail</option>
                <option value="quiz">Alleen quiz</option>
                <option value="email">Alleen e-mail</option>
              </select>
            </div>
            <p className="mt-2.5 text-sm text-wine/55">
              {filtered.length}{" "}
              {filtered.length === 1 ? "persoon" : "personen"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-subtle bg-beige/40 px-6 py-12 text-center">
              <p className="font-serif text-lg text-burgundy">Geen resultaten</p>
              <p className="mt-1 text-sm text-wine/60">
                Pas je filters aan of wis de zoekopdracht.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((person) => (
                <PersonRow
                  key={person.email}
                  person={person}
                  removing={removingEmail === person.email}
                  onRemove={() => void handleRemove(person)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "whatsapp" ? (
        <WaitlistWhatsappLinksForm initialLinks={whatsappLinks} />
      ) : null}
    </div>
  );
}
