"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminPath } from "@/lib/admin-url";
import { OUTREACH_MANUAL_MAIL_KEY } from "@/lib/outreach/constants";
import {
  MAIL_STATUSES,
  MAIL_STATUS_CLASSES,
  MAIL_STATUS_LABELS,
  mailStatus,
  type MailStatus,
  type OutreachMessageLogRow,
} from "@/lib/outreach/message-status";

const dateTime = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormat = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDateTime(iso: string | null): string {
  return iso ? dateTime.format(new Date(iso)) : "—";
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function Timestamp({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-wine/50">{label}</dt>
      <dd className="text-wine/75">{formatDateTime(value)}</dd>
    </div>
  );
}

export function OutreachMailLog({ messages }: { messages: OutreachMessageLogRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MailStatus>("all");
  const [stepFilter, setStepFilter] = useState<"all" | number>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const steps = useMemo(
    () =>
      [...new Set(messages.map((row) => row.step).filter((s): s is number => !!s))].sort(),
    [messages],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return messages.filter((row) => {
      if (statusFilter !== "all" && mailStatus(row) !== statusFilter) return false;
      if (stepFilter !== "all" && row.step !== stepFilter) return false;
      if (!query) return true;
      return [row.prospectName, row.subject, row.toEmail, row.city]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [messages, search, statusFilter, stepFilter]);

  const totals = useMemo(() => {
    const counts = { delivered: 0, opened: 0, problem: 0 };
    for (const row of messages) {
      const status = mailStatus(row);
      if (row.deliveredAt) counts.delivered += 1;
      if (row.firstOpenedAt) counts.opened += 1;
      if (status === "bounced" || status === "failed" || status === "complained") {
        counts.problem += 1;
      }
    }
    return counts;
  }, [messages]);

  /** Group by send day so a batch reads as one block. */
  const groups = useMemo(() => {
    const map = new Map<string, OutreachMessageLogRow[]>();
    for (const row of filtered) {
      const key = dayKey(row.sentAt);
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={adminPath("/outreach")}
          className="text-sm text-wine/60 transition hover:text-burgundy"
        >
          ← Outreach
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-burgundy sm:text-4xl">
          Verzonden mails
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          Elke mail die de deur uit ging, met datum, tijd en wat er daarna mee
          gebeurde. Klik een regel open voor de exacte tekst die verstuurd is.
        </p>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-6 text-sm text-wine/60">
          Er is nog geen mail verstuurd. Zodra je de eerste batch stuurt, staat
          hier elke mail met tijdstip en status.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Verstuurd", value: messages.length },
              { label: "Afgeleverd", value: totals.delivered },
              { label: "Geopend", value: totals.opened },
              { label: "Problemen", value: totals.problem },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-3xl text-burgundy">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Zoek op zaak, onderwerp of e-mail…"
              className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | MailStatus)
                }
                className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
                aria-label="Filter op status"
              >
                <option value="all">Alle statussen</option>
                {MAIL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {MAIL_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <select
                value={String(stepFilter)}
                onChange={(event) =>
                  setStepFilter(
                    event.target.value === "all"
                      ? "all"
                      : Number(event.target.value),
                  )
                }
                className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
                aria-label="Filter op mail"
              >
                <option value="all">Alle mails</option>
                {steps.map((step) => (
                  <option key={step} value={step}>
                    Mail {step}
                  </option>
                ))}
              </select>
              <span className="text-xs text-wine/50">
                {filtered.length} van {messages.length}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {groups.map(([day, rows]) => (
              <section key={day} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-wine/45">
                  {dayFormat.format(new Date(day))} · {rows.length}{" "}
                  {rows.length === 1 ? "mail" : "mails"}
                </h2>
                <div className="divide-y divide-border-subtle/60 overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige">
                  {rows.map((row) => {
                    const status = mailStatus(row);
                    const isOpen = expanded === row.id;
                    return (
                      <div key={row.id}>
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : row.id)}
                          className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-cream/40 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <span className="w-16 shrink-0 font-mono text-xs text-wine/60">
                            {new Date(row.sentAt).toLocaleTimeString("nl-NL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-burgundy">
                              {row.prospectName}
                            </span>
                            <span className="block truncate text-xs text-wine/55">
                              {row.subject}
                            </span>
                          </span>
                          <span className="flex flex-wrap items-center gap-3 text-xs text-wine/60">
                            {row.step ? (
                              <span className="rounded-full border border-border-subtle px-2 py-0.5">
                                Mail {row.step}
                              </span>
                            ) : row.templateKey === OUTREACH_MANUAL_MAIL_KEY ? (
                              <span className="rounded-full border border-gold/40 bg-gold/[0.12] px-2 py-0.5 text-[#7A5A2B]">
                                Eigen mail
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full border px-2.5 py-0.5 font-medium ${MAIL_STATUS_CLASSES[status]}`}
                            >
                              {MAIL_STATUS_LABELS[status]}
                            </span>
                            {row.openCount > 0 ? (
                              <span>{row.openCount}× open</span>
                            ) : null}
                            <span className="text-wine/40">
                              {isOpen ? "▲" : "▼"}
                            </span>
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="grid gap-5 border-t border-border-subtle/60 bg-cream/50 p-4 sm:grid-cols-[minmax(0,1fr)_260px]">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
                                Verstuurde tekst
                              </p>
                              <p className="mt-1 text-sm font-medium text-burgundy">
                                {row.subject}
                              </p>
                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-wine/80">
                                {row.bodySnapshot}
                              </p>
                              {row.attachmentName ? (
                                <p className="mt-3 text-xs text-wine/55">
                                  📎 {row.attachmentName}
                                </p>
                              ) : null}
                            </div>
                            <dl className="space-y-1 text-xs">
                              <div className="flex justify-between gap-3">
                                <dt className="text-wine/50">Naar</dt>
                                <dd className="truncate text-wine/75">
                                  {row.toEmail}
                                </dd>
                              </div>
                              <Timestamp label="Verstuurd" value={row.sentAt} />
                              <Timestamp
                                label="Afgeleverd"
                                value={row.deliveredAt}
                              />
                              <Timestamp
                                label="Eerste opening"
                                value={row.firstOpenedAt}
                              />
                              <Timestamp
                                label="Laatste opening"
                                value={row.lastOpenedAt}
                              />
                              <Timestamp
                                label="Eerste klik"
                                value={row.firstClickedAt}
                              />
                              <Timestamp label="Bounce" value={row.bouncedAt} />
                              <Timestamp
                                label="Spamklacht"
                                value={row.complainedAt}
                              />
                              {row.openCount > 0 ? (
                                <div className="flex justify-between gap-3">
                                  <dt className="text-wine/50">Openingen</dt>
                                  <dd className="text-wine/75">{row.openCount}</dd>
                                </div>
                              ) : null}
                              {row.error ? (
                                <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-2 py-1 text-red-800">
                                  {row.error}
                                </p>
                              ) : null}
                              <Link
                                href={adminPath(`/outreach/${row.prospectId}`)}
                                className="mt-3 inline-block text-burgundy underline-offset-2 hover:underline"
                              >
                                Naar {row.prospectName} →
                              </Link>
                            </dl>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {groups.length === 0 ? (
              <p className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-6 text-sm text-wine/60">
                Geen mails in dit filter.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
