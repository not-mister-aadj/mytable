"use client";

import Link from "next/link";
import { Fragment, useMemo, useRef, useState } from "react";
import { adminPath } from "@/lib/admin-url";
import { MAIL_GOALS, type MailGoalId } from "@/lib/email/mail-catalog";

export type MailListRow = {
  kind: string;
  title: string;
  goal: MailGoalId;
  when: string;
  auto: boolean;
  to: string;
  sent: number;
  opened: { part: number; total: number };
  clicked: { part: number; total: number };
  booked: { part: number; total: number } | null;
  /** The next send that is planned or due, "vr 20 nov · Rotterdam · 14". */
  next: string | null;
  samples: Array<{ id: string; to: string; subject: string; from: string | null; sentAt: string }>;
  previewPath: string | null;
  managePath: string | null;
};

const dateTime = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

const chip = (on: boolean) =>
  `rounded-full px-3 py-1 text-sm transition ${on ? "bg-burgundy text-cream" : "border border-border-subtle bg-cream text-wine hover:border-burgundy/30"}`;

function Share({ rate }: { rate: { part: number; total: number } }) {
  if (rate.total === 0) return <span className="text-wine/35">–</span>;
  const p = Math.round((rate.part / rate.total) * 100);
  return (
    <span className="inline-flex items-center justify-end gap-2" title={`${rate.part} van ${rate.total}`}>
      {p}%
      <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-wine/10 sm:block">
        <span className="block h-full rounded-full bg-burgundy" style={{ width: `${p}%` }} />
      </span>
    </span>
  );
}

/** Every mail we send, by goal; the mail itself, as the last guest got it, next to the row you point at. */
export function MailListView({ rows }: { rows: MailListRow[] }) {
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState<MailGoalId | "all">("all");
  const [how, setHow] = useState<"all" | "auto" | "hand">("all");
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [sampleOf, setSampleOf] = useState<Record<string, number>>({});
  // A short wait, so moving the mouse down the list doesn't load every mail on the way.
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null);
  const point = (kind: string) => {
    if (hover.current) clearTimeout(hover.current);
    hover.current = setTimeout(() => setActive(kind), 120);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (goal !== "all" && r.goal !== goal) return false;
      if (how === "auto" && !r.auto) return false;
      if (how === "hand" && r.auto) return false;
      return !q || `${r.title} ${r.when} ${r.to} ${r.samples[0]?.subject ?? ""}`.toLowerCase().includes(q);
    });
  }, [rows, search, goal, how]);

  const shownKind = pinned ?? active;
  const shown = rows.find((r) => r.kind === shownKind) ?? null;
  const sample = shown ? (shown.samples[sampleOf[shown.kind] ?? 0] ?? shown.samples[0] ?? null) : null;
  const goals = MAIL_GOALS.filter((g) => rows.some((r) => r.goal === g.id));

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="min-w-0 rounded-2xl border border-border-subtle/80 bg-beige/50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, moment of onderwerp"
            className="min-w-[200px] flex-1 rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
          />
          <button type="button" className={chip(goal === "all")} onClick={() => setGoal("all")}>
            Alle doelen
          </button>
          {goals.map((g) => (
            <button key={g.id} type="button" className={chip(goal === g.id)} onClick={() => setGoal(g.id)}>
              {g.label}
            </button>
          ))}
          <span className="w-1" />
          <button type="button" className={chip(how === "auto")} onClick={() => setHow(how === "auto" ? "all" : "auto")}>
            Automatisch
          </button>
          <button type="button" className={chip(how === "hand")} onClick={() => setHow(how === "hand" ? "all" : "hand")}>
            Met de hand
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                <th className="px-3 py-2.5">Mail</th>
                <th className="px-3 py-2.5">Wanneer</th>
                <th className="px-3 py-2.5">Aan</th>
                <th className="px-3 py-2.5">Hoe</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right">30 dagen</th>
                <th className="px-3 py-2.5 text-right">Geopend</th>
                <th className="px-3 py-2.5 text-right">Geklikt</th>
                <th className="px-3 py-2.5 text-right">Geboekt</th>
                <th className="px-3 py-2.5">Volgende</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {goals
                .filter((g) => visible.some((r) => r.goal === g.id))
                .map((g) => (
                  <Fragment key={g.id}>
                    <tr className="bg-cream/70">
                      <td colSpan={9} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-burgundy">
                        {g.label}
                      </td>
                    </tr>
                    {visible
                      .filter((r) => r.goal === g.id)
                      .map((r) => {
                        const on = shownKind === r.kind;
                        return (
                          <tr
                            key={r.kind}
                            tabIndex={0}
                            onMouseEnter={() => point(r.kind)}
                            onFocus={() => setActive(r.kind)}
                            onClick={() => setPinned(pinned === r.kind ? null : r.kind)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setPinned(pinned === r.kind ? null : r.kind);
                            }}
                            aria-selected={on}
                            className={`cursor-pointer border-b border-border-subtle/50 align-top outline-none transition focus-visible:ring-2 focus-visible:ring-burgundy/40 ${
                              on ? "bg-burgundy/[0.07]" : "hover:bg-cream/70"
                            }`}
                          >
                            <td className="px-3 py-2.5 font-medium text-wine">{r.title}</td>
                            <td className="px-3 py-2.5 text-wine/75">{r.when}</td>
                            <td className="px-3 py-2.5 text-wine/75">{r.to}</td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                  r.auto ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70" : "bg-amber-50 text-amber-900 ring-amber-200/80"
                                }`}
                              >
                                {r.auto ? "Automatisch" : "Met de hand"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-wine">{r.sent > 0 ? r.sent : <span className="text-wine/35">–</span>}</td>
                            <td className="px-3 py-2.5 text-right text-wine">
                              <Share rate={r.opened} />
                            </td>
                            <td className="px-3 py-2.5 text-right text-wine">
                              <Share rate={r.clicked} />
                            </td>
                            <td className="px-3 py-2.5 text-right text-wine">
                              {r.booked && r.booked.total > 0 ? (
                                <span title={`${r.booked.part} van ${r.booked.total}`}>{Math.round((r.booked.part / r.booked.total) * 100)}%</span>
                              ) : (
                                <span className="text-wine/35">–</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-xs text-wine/65">{r.next ?? "–"}</td>
                          </tr>
                        );
                      })}
                  </Fragment>
                ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-wine/50">
                    Geen mails gevonden
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="min-w-0 rounded-2xl border border-border-subtle/80 bg-beige/50 p-4 sm:p-5 xl:sticky xl:top-4" aria-live="polite">
        {shown ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-xl text-burgundy">{shown.title}</h2>
              {pinned === shown.kind ? (
                <button type="button" onClick={() => setPinned(null)} className="shrink-0 text-xs font-medium text-wine/60 underline underline-offset-2 hover:text-burgundy">
                  Losmaken
                </button>
              ) : null}
            </div>
            {sample ? (
              <>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="text-wine/50">Van</dt>
                  <dd className="truncate text-wine">{sample.from ?? "–"}</dd>
                  <dt className="text-wine/50">Aan</dt>
                  <dd className="truncate text-wine">{sample.to}</dd>
                  <dt className="text-wine/50">Onderwerp</dt>
                  <dd className="text-wine">{sample.subject}</dd>
                  <dt className="text-wine/50">Verstuurd</dt>
                  <dd className="text-wine">{dateTime.format(new Date(sample.sentAt)).replace(/\./g, "")}</dd>
                </dl>
                {shown.samples.length > 1 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {shown.samples.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSampleOf({ ...sampleOf, [shown.kind]: i })}
                        className={`max-w-[12rem] truncate rounded-full px-2.5 py-0.5 text-xs ${
                          s.id === sample.id ? "bg-burgundy text-cream" : "border border-border-subtle bg-cream text-wine hover:border-burgundy/30"
                        }`}
                      >
                        {s.to}
                      </button>
                    ))}
                  </div>
                ) : null}
                <iframe
                  key={sample.id}
                  title={sample.subject}
                  src={`/api/admin/email-log/${sample.id}`}
                  sandbox=""
                  className="mt-3 h-[560px] w-full rounded-xl border border-border-subtle bg-white"
                />
              </>
            ) : (
              <p className="mt-3 text-sm text-wine/55">Nog niet verstuurd</p>
            )}
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {shown.sent > 0 ? (
                <Link href={adminPath(`/emails?tab=verstuurd&soort=${encodeURIComponent(shown.kind)}`)} className="text-burgundy hover:underline">
                  Alle verzendingen
                </Link>
              ) : null}
              {shown.previewPath ? (
                <Link href={adminPath(shown.previewPath)} className="text-burgundy hover:underline">
                  Sjabloon
                </Link>
              ) : null}
              {shown.managePath ? (
                <Link href={adminPath(shown.managePath)} className="text-burgundy hover:underline">
                  Beheer
                </Link>
              ) : null}
            </p>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-wine/50">Beweeg over een mail</p>
        )}
      </aside>
    </div>
  );
}
