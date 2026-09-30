"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WaitlistAnswerPerson } from "@/lib/admin-waitlist-answers-data";
import { adminPath } from "@/lib/admin-url";
import {
  AGE_LABELS,
  TICKET_PRICE_LABELS,
} from "@/lib/priority-list-labels";
import {
  WAITLIST_QUESTIONS,
  answerLabel,
  type WaitlistAnswerKey,
} from "@/lib/waitlist-answers";

type BuyerFilter = "all" | "buyers" | "waitlist_only";

const NO_AGE = "__none__";

/** Shown in this order; ordinal questions keep their answer order. */
const DISTRIBUTIONS: { key: WaitlistAnswerKey; ordinal: boolean }[] = [
  { key: "ageRange", ordinal: true },
  { key: "gender", ordinal: false },
  { key: "language", ordinal: false },
  { key: "ticket", ordinal: true },
  { key: "interests", ordinal: false },
  { key: "company", ordinal: false },
  { key: "why", ordinal: false },
  { key: "tableType", ordinal: false },
  { key: "sundayAvailability", ordinal: true },
];

type Bucket = { id: string; label: string; count: number };

const selectClass =
  "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl text-burgundy">{value}</p>
    </div>
  );
}

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function DistributionBars({
  title,
  subtitle,
  buckets,
  total,
}: {
  title: string;
  subtitle: string;
  buckets: Bucket[];
  total: number;
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
      <h3 className="font-serif text-base text-burgundy">{title}</h3>
      <p className="mt-0.5 text-xs text-wine/50">{subtitle}</p>
      {total === 0 || buckets.length === 0 ? (
        <p className="mt-4 text-sm text-wine/50">Niemand in deze selectie.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {buckets.map((bucket) => (
            <div key={bucket.id}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-wine">{bucket.label}</span>
                <span className="shrink-0 tabular-nums text-wine/60">
                  {bucket.count} · {percent(bucket.count, total)}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-beige">
                <div
                  className="h-full rounded-full bg-burgundy/80"
                  style={{
                    width: `${bucket.count > 0 ? Math.max(2, (bucket.count / max) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function countBuckets(
  values: string[][],
  labels: Record<string, string>,
  ordinal: boolean,
  labelFor: (id: string) => string,
): Bucket[] {
  const counts = new Map<string, number>();
  for (const ids of values) {
    for (const id of new Set(ids)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const known = Object.keys(labels);
  const ids = ordinal
    ? [
        ...known.filter((id) => counts.has(id)),
        ...[...counts.keys()].filter((id) => !known.includes(id)),
      ]
    : [...counts.keys()].sort(
        (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0),
      );
  return ids.map((id) => ({
    id,
    label: labelFor(id),
    count: counts.get(id) ?? 0,
  }));
}

export function WaitlistAnswersOverview({
  people,
}: {
  people: WaitlistAnswerPerson[];
}) {
  const [city, setCity] = useState("all");
  const [buyer, setBuyer] = useState<BuyerFilter>("all");
  const [age, setAge] = useState("all");

  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of people) {
      for (const c of person.cities) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nl"),
    );
  }, [people]);

  const selection = useMemo(
    () =>
      people.filter((person) => {
        if (city !== "all" && !person.cities.includes(city)) return false;
        if (buyer === "buyers" && !person.isBuyer) return false;
        if (buyer === "waitlist_only" && person.isBuyer) return false;
        if (age !== "all") {
          const ages = person.answers?.ageRange ?? [];
          if (age === NO_AGE ? ages.length > 0 : !ages.includes(age)) {
            return false;
          }
        }
        return true;
      }),
    [people, city, buyer, age],
  );

  const answered = selection.filter((p) => p.answers !== null);

  const distributions = DISTRIBUTIONS.map(({ key, ordinal }) => {
    const question = WAITLIST_QUESTIONS.find((q) => q.key === key)!;
    const values = answered
      .map((p) => p.answers![key])
      .filter((ids) => ids.length > 0);
    return {
      question,
      total: values.length,
      buckets: countBuckets(values, question.labels, ordinal, (id) =>
        answerLabel(question, id),
      ),
    };
  });

  // Signup cities plus any extra city named in the questionnaire.
  const cityBuckets = countBuckets(
    selection.map((p) => [...p.cities, ...(p.answers?.cities ?? [])]),
    {},
    false,
    (id) => id,
  ).slice(0, 10);

  const ageRows = [...Object.keys(AGE_LABELS)];
  const ticketCols = Object.keys(TICKET_PRICE_LABELS);
  const crossPeople = answered.filter(
    (p) => p.answers!.ageRange.length > 0 && p.answers!.ticket.length > 0,
  );
  const cross = ageRows.map((ageId) => {
    const inRow = crossPeople.filter((p) => p.answers!.ageRange.includes(ageId));
    return {
      ageId,
      total: inRow.length,
      cells: ticketCols.map(
        (ticketId) =>
          inRow.filter((p) => p.answers!.ticket.includes(ticketId)).length,
      ),
    };
  });
  const crossMax = Math.max(...cross.flatMap((row) => row.cells), 1);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={adminPath("/customers")}
          className="text-sm text-wine/55 transition hover:text-burgundy"
        >
          ← Alle klanten
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-burgundy sm:text-4xl">
          Wachtlijstantwoorden
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          Eén regel per persoon op de wachtlijst, met de laatst ingevulde
          vragenlijst. Meerkeuzevragen tellen per gekozen antwoord, dus de
          percentages kunnen samen boven de 100% uitkomen.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={selectClass}
          aria-label="Filter op stad"
        >
          <option value="all">Alle steden</option>
          {cityOptions.map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>
        <select
          value={buyer}
          onChange={(e) => setBuyer(e.target.value as BuyerFilter)}
          className={selectClass}
          aria-label="Filter op koper"
        >
          <option value="all">Iedereen</option>
          <option value="buyers">Kopers</option>
          <option value="waitlist_only">Alleen wachtlijst</option>
        </select>
        <select
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={selectClass}
          aria-label="Filter op leeftijd"
        >
          <option value="all">Alle leeftijden</option>
          {Object.entries(AGE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
          <option value={NO_AGE}>Leeftijd niet ingevuld</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Mensen in selectie" value={String(selection.length)} />
        <StatCard
          label="Met vragenlijst ingevuld"
          value={String(answered.length)}
        />
        <StatCard
          label="% ingevuld"
          value={`${percent(answered.length, selection.length)}%`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {distributions.map(({ question, total, buckets }) => (
          <DistributionBars
            key={question.key}
            title={question.label}
            subtitle={`${total} ${total === 1 ? "persoon" : "mensen"} beantwoord`}
            buckets={buckets}
            total={total}
          />
        ))}
        <DistributionBars
          title="Steden (top 10)"
          subtitle={`Aanmeldsteden, van ${selection.length} mensen`}
          buckets={cityBuckets}
          total={selection.length}
        />
      </div>

      <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
        <h3 className="font-serif text-base text-burgundy">
          Ticketbudget per leeftijdsgroep
        </h3>
        <p className="mt-0.5 text-xs text-wine/50">
          {crossPeople.length} mensen hebben beide ingevuld. Percentage is van de
          leeftijdsgroep.
        </p>
        {crossPeople.length === 0 ? (
          <p className="mt-4 text-sm text-wine/50">Niemand in deze selectie.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 text-xs uppercase tracking-[0.06em] text-wine/50">
                  <th className="py-2 pr-4">Leeftijd</th>
                  {ticketCols.map((id) => (
                    <th key={id} className="py-2 pr-4 text-right">
                      {TICKET_PRICE_LABELS[id]}
                    </th>
                  ))}
                  <th className="py-2 text-right">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {cross.map((row) => (
                  <tr
                    key={row.ageId}
                    className="border-b border-border-subtle/40 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-wine">
                      {AGE_LABELS[row.ageId]}
                    </td>
                    {row.cells.map((count, i) => (
                      <td key={ticketCols[i]} className="py-1.5 pr-4 text-right">
                        {count > 0 ? (
                          <span
                            className="inline-block min-w-[4.5rem] rounded-lg px-2 py-1 tabular-nums text-wine"
                            style={{
                              backgroundColor: `rgba(90, 15, 27,${0.08 + (count / crossMax) * 0.32})`,
                            }}
                          >
                            {count}
                            <span className="ml-1 text-xs text-wine/60">
                              {percent(count, row.total)}%
                            </span>
                          </span>
                        ) : (
                          <span className="text-wine/30">-</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 text-right tabular-nums text-wine/70">
                      {row.total}
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
