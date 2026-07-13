"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  removeBookingFromEventAction,
  resendBookingConfirmationAction,
  transferBookingToEventAction,
} from "@/app/admin/(dashboard)/events/actions";
import { adminPath, getSiteUrl } from "@/lib/admin-url";
import { formatSeatingPreference, isSeatingPreference } from "@/lib/booking-seating";
import {
  formatTableLanguagePreference,
  isTableLanguagePreference,
} from "@/lib/booking-table-language";
import type {
  EventTicketRow,
  TransferTargetEvent,
} from "@/lib/event-tickets-types";
import { formatEventAdminListDate } from "@/lib/event-datetime-local";

type EventSummary = {
  id: string;
  nameNl: string;
  city: string;
  startsAt: Date | string;
  spotsSold: number;
  capacity: number;
  slug: string;
};

function formatEventDate(iso: string) {
  return formatEventAdminListDate(new Date(iso), "nl", { weekday: "short" });
}

function guestLabel(ticket: EventTicketRow) {
  return ticket.customerName?.trim() || "Gast zonder naam";
}

function guestInitials(ticket: EventTicketRow) {
  const name = guestLabel(ticket);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function occupancyTone(sold: number, capacity: number) {
  if (capacity <= 0 || sold >= capacity) return "full" as const;
  if (sold / capacity >= 0.75) return "warning" as const;
  return "healthy" as const;
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-beige/80 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            {label}
          </p>
          <p className="mt-2 font-serif text-2xl text-burgundy">{value}</p>
          {hint ? (
            <p className="mt-1.5 text-xs text-wine/55">{hint}</p>
          ) : null}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-burgundy/70">
          {icon}
        </div>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-6 4 3 5-8" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" />
      <path d="M13 6v12" />
    </svg>
  );
}

function TicketStatusBadge({ ticket }: { ticket: EventTicketRow }) {
  if (ticket.lifecycleStatus === "transferred") {
    return (
      <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-900 ring-1 ring-inset ring-orange-300/70">
        Verplaatst
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/60">
      Actief
    </span>
  );
}

function GuestNotes({ ticket }: { ticket: EventTicketRow }) {
  const notes: string[] = [];

  if (
    ticket.seatingPreference &&
    isSeatingPreference(ticket.seatingPreference)
  ) {
    notes.push(formatSeatingPreference(ticket.seatingPreference, "nl"));
  }
  if (
    ticket.seatingPreference === "join_others" &&
    ticket.tableLanguagePreference &&
    isTableLanguagePreference(ticket.tableLanguagePreference)
  ) {
    notes.push(
      formatTableLanguagePreference(ticket.tableLanguagePreference, "nl"),
    );
  }
  if (ticket.dietaryNotes?.trim()) {
    notes.push(ticket.dietaryNotes.trim());
  }

  if (notes.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {notes.map((note) => (
        <span
          key={note}
          className="inline-flex rounded-full bg-wine/[0.05] px-2.5 py-1 text-xs text-wine/65 ring-1 ring-inset ring-border-subtle/60"
        >
          {note}
        </span>
      ))}
    </div>
  );
}

function TransferDestinationBlock({ ticket }: { ticket: EventTicketRow }) {
  if (!ticket.transferDestination) return null;

  const dest = ticket.transferDestination;

  return (
    <div className="mt-3 rounded-xl border border-orange-200/80 bg-orange-50/70 px-3 py-2.5 text-xs text-orange-950">
      <p className="font-semibold uppercase tracking-[0.05em] text-orange-800/80">
        Verplaatst naar
      </p>
      <p className="mt-1 font-medium">{dest.nameNl}</p>
      <p className="text-orange-900/75">
        {dest.city} · {formatEventDate(dest.startsAt)}
      </p>
      {ticket.transferredBy ? (
        <p className="mt-1 text-orange-900/60">Door {ticket.transferredBy}</p>
      ) : null}
      <Link
        href={adminPath(`/events/${dest.eventId}/guests`)}
        className="mt-2 inline-flex items-center gap-1 font-medium text-orange-900 underline-offset-2 hover:underline"
      >
        Open doeltafel →
      </Link>
    </div>
  );
}

function GuestActions({
  ticket,
  eventId,
  targets,
  onChanged,
  layout = "card",
}: {
  ticket: EventTicketRow;
  eventId: string;
  targets: TransferTargetEvent[];
  onChanged: () => void;
  layout?: "card" | "inline";
}) {
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isTransferred = ticket.lifecycleStatus === "transferred";

  const eligibleTargets = useMemo(
    () => targets.filter((t) => t.spotsAvailable >= ticket.seats),
    [targets, ticket.seats],
  );

  function handleTransfer() {
    if (!targetId) return;
    setError(null);
    startTransition(async () => {
      const result = await transferBookingToEventAction(ticket.id, targetId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTargetId("");
      onChanged();
    });
  }

  function handleResendConfirmation() {
    setError(null);
    startTransition(async () => {
      const result = await resendBookingConfirmationAction(ticket.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      alert("Bevestigingsmail verstuurd.");
    });
  }

  function handleRemove() {
    const name = guestLabel(ticket);
    const confirmed = confirm(
      `Weet je zeker dat je ${name} wilt verwijderen van deze tafel?\n\n` +
        `${ticket.seats} ${ticket.seats === 1 ? "plek wordt" : "plekken worden"} vrijgegeven. ` +
        "Dit annuleert het ticket in MyTable. Stripe wordt niet automatisch terugbetaald.",
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await removeBookingFromEventAction(ticket.id, eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onChanged();
    });
  }

  if (isTransferred) {
    return (
      <p className="text-xs text-wine/50">
        Alleen ter referentie — telt niet mee voor bezetting.
      </p>
    );
  }

  const transferRow = (
    <div
      className={
        layout === "card"
          ? "flex flex-col gap-2 sm:flex-row sm:items-center"
          : "flex min-w-[240px] flex-col gap-2"
      }
    >
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        disabled={isPending || eligibleTargets.length === 0}
        className="w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10 disabled:opacity-50"
        aria-label={`Verplaats ${guestLabel(ticket)}`}
      >
        <option value="">
          {eligibleTargets.length === 0
            ? "Geen tafel met plek"
            : "Verplaats naar…"}
        </option>
        {eligibleTargets.map((target) => (
          <option key={target.id} value={target.id}>
            {target.nameNl} · {target.city} · {formatEventDate(target.startsAt)}{" "}
            ({target.spotsAvailable} vrij)
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleTransfer}
        disabled={!targetId || isPending}
        className="shrink-0 rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Verplaats
      </button>
    </div>
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleResendConfirmation}
        disabled={isPending}
        className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm font-medium text-wine/75 transition hover:border-burgundy/25 hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50"
      >
        Mail opnieuw
      </button>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-full border border-red-800/20 bg-cream px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Bezig…" : "Verwijder"}
      </button>
    </div>
  );

  return (
    <div className={layout === "card" ? "mt-4 space-y-3 border-t border-border-subtle/60 pt-4" : "space-y-2"}>
      {transferRow}
      {actionButtons}
      {error ? <p className="text-xs text-red-800">{error}</p> : null}
    </div>
  );
}

function GuestCard({
  ticket,
  eventId,
  targets,
  onChanged,
  index,
}: {
  ticket: EventTicketRow;
  eventId: string;
  targets: TransferTargetEvent[];
  onChanged: () => void;
  index: number;
}) {
  const isTransferred = ticket.lifecycleStatus === "transferred";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-2xl border border-border-subtle/80 bg-cream/70 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.04)] ${
        isTransferred ? "bg-orange-50/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-burgundy/10 font-medium text-burgundy">
            {guestInitials(ticket)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-wine">{guestLabel(ticket)}</p>
            <p className="mt-0.5 truncate text-sm text-wine/55">{ticket.email}</p>
            <p className="mt-2 font-mono text-xs tracking-wide text-wine/45">
              {ticket.reservationCode}
              <span className="mx-2 text-wine/25">·</span>
              {ticket.seats} {ticket.seats === 1 ? "plek" : "plekken"}
            </p>
          </div>
        </div>
        <TicketStatusBadge ticket={ticket} />
      </div>

      <GuestNotes ticket={ticket} />
      {isTransferred ? <TransferDestinationBlock ticket={ticket} /> : null}

      <GuestActions
        ticket={ticket}
        eventId={eventId}
        targets={targets}
        onChanged={onChanged}
        layout="card"
      />
    </motion.article>
  );
}

function GuestTableRow({
  ticket,
  eventId,
  targets,
  onChanged,
  index,
}: {
  ticket: EventTicketRow;
  eventId: string;
  targets: TransferTargetEvent[];
  onChanged: () => void;
  index: number;
}) {
  const isTransferred = ticket.lifecycleStatus === "transferred";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={`border-b border-border-subtle/50 align-top ${
        isTransferred ? "bg-orange-50/35" : "hover:bg-cream/60"
      }`}
    >
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/10 text-sm font-medium text-burgundy">
            {guestInitials(ticket)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-wine">{guestLabel(ticket)}</p>
            <p className="mt-0.5 text-xs text-wine/55">{ticket.email}</p>
            <GuestNotes ticket={ticket} />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="font-mono text-xs tracking-wide text-wine/60">
          {ticket.reservationCode}
        </span>
      </td>
      <td className="px-5 py-4 font-medium text-wine">{ticket.seats}</td>
      <td className="px-5 py-4">
        {ticket.dietaryNotes?.trim() ? (
          <span className="text-xs text-wine/70">{ticket.dietaryNotes.trim()}</span>
        ) : (
          <span className="text-xs text-wine/35">–</span>
        )}
      </td>
      <td className="px-5 py-4">
        <TicketStatusBadge ticket={ticket} />
        {isTransferred ? <TransferDestinationBlock ticket={ticket} /> : null}
      </td>
      <td className="px-5 py-4">
        <GuestActions
          ticket={ticket}
          eventId={eventId}
          targets={targets}
          onChanged={onChanged}
          layout="inline"
        />
      </td>
    </motion.tr>
  );
}

export function EventGuestsView({
  event,
  tickets,
  transferTargets,
}: {
  event: EventSummary;
  tickets: EventTicketRow[];
  transferTargets: TransferTargetEvent[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const activeCount = tickets.filter((t) => t.lifecycleStatus === "active").length;
  const transferredCount = tickets.filter(
    (t) => t.lifecycleStatus === "transferred",
  ).length;
  const spotsFree = Math.max(0, event.capacity - event.spotsSold);
  const tone = occupancyTone(event.spotsSold, event.capacity);
  const occupancyPct =
    event.capacity > 0
      ? Math.round((event.spotsSold / event.capacity) * 100)
      : 0;

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) => {
      const haystack = [
        guestLabel(ticket),
        ticket.email,
        ticket.reservationCode,
        ticket.dietaryNotes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tickets, search]);

  const publicUrl = `${getSiteUrl()}/nl/agenda/${event.slug}`;
  const onChanged = () => router.refresh();

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-border-subtle/80 bg-gradient-to-br from-beige via-cream to-beige shadow-[0_16px_50px_rgba(43,13,18,0.06)]">
        <div className="border-b border-border-subtle/60 px-6 py-5 sm:px-8">
          <Link
            href={adminPath("/events")}
            className="inline-flex items-center gap-1.5 text-sm text-wine/55 transition hover:text-burgundy"
          >
            <span aria-hidden>←</span> Terug naar tafels
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-wine/45">
                Gastenlijst
              </p>
              <h1 className="mt-1 font-serif text-3xl text-burgundy sm:text-4xl">
                {event.nameNl}
              </h1>
              <p className="mt-2 text-sm text-wine/65">
                {event.city} · {formatEventAdminListDate(new Date(event.startsAt))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={adminPath(`/events/${event.id}/edit`)}
                prefetch={false}
                className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm font-medium text-wine transition hover:border-burgundy/30"
              >
                Tafel bewerken
              </Link>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm font-medium text-wine transition hover:border-burgundy/30"
              >
                Publieke pagina
              </a>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-wine/70">Bezetting</p>
              <p className="mt-0.5 text-xs text-wine/50">
                {event.spotsSold} van {event.capacity} plekken · {spotsFree} vrij
              </p>
            </div>
            <p className="font-serif text-lg text-burgundy">{occupancyPct}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-wine/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                tone === "full"
                  ? "bg-red-500"
                  : tone === "warning"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Actieve gasten"
          value={String(activeCount)}
          hint={
            transferredCount > 0
              ? `${transferredCount} verplaatst (historisch)`
              : undefined
          }
          icon={<UsersIcon />}
        />
        <StatCard
          label="Bezetting"
          value={`${event.spotsSold}/${event.capacity}`}
          hint={`${occupancyPct}% vol`}
          icon={<ChartIcon />}
        />
        <StatCard
          label="Plekken vrij"
          value={String(spotsFree)}
          hint={spotsFree === 0 ? "Tafel is vol" : "Nog te boeken"}
          icon={<TicketIcon />}
        />
        <StatCard
          label="Tickets totaal"
          value={String(tickets.length)}
          hint="Inclusief verplaatst"
          icon={<TicketIcon />}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl text-burgundy">Gasten</h2>
          <p className="mt-1 text-sm text-wine/55">
            Beheer tickets, verplaatsingen en bevestigingsmails voor deze tafel.
          </p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Zoek gasten</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of code…"
            className="w-full rounded-full border border-border-subtle bg-cream py-2.5 pl-4 pr-4 text-sm text-wine outline-none transition placeholder:text-wine/35 focus:border-burgundy/35 focus:ring-2 focus:ring-burgundy/10"
          />
        </label>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="font-serif text-xl text-burgundy">Nog geen gasten</p>
          <p className="mt-2 text-sm text-wine/60">
            Zodra iemand een ticket koopt, verschijnt de gast hier automatisch.
          </p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-12 text-center">
          <p className="font-serif text-lg text-burgundy">Geen resultaten</p>
          <p className="mt-2 text-sm text-wine/60">
            Probeer een andere zoekterm.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {filteredTickets.map((ticket, index) => (
              <GuestCard
                key={ticket.id}
                ticket={ticket}
                eventId={event.id}
                targets={transferTargets}
                onChanged={onChanged}
                index={index}
              />
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)] lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                    <th className="px-5 py-3.5">Gast</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Plekken</th>
                    <th className="px-5 py-3.5">Allergieën</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket, index) => (
                    <GuestTableRow
                      key={ticket.id}
                      ticket={ticket}
                      eventId={event.id}
                      targets={transferTargets}
                      onChanged={onChanged}
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
