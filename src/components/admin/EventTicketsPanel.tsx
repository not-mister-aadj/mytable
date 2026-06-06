"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  removeBookingFromEventAction,
  resendBookingConfirmationAction,
  transferBookingToEventAction,
} from "@/app/admin/(dashboard)/events/actions";
import { adminPath } from "@/lib/admin-url";
import type {
  EventTicketRow,
  TransferTargetEvent,
} from "@/lib/event-tickets-types";

function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function guestLabel(ticket: EventTicketRow) {
  return ticket.customerName?.trim() || "Gast zonder naam";
}

function TicketStatusBadge({ ticket }: { ticket: EventTicketRow }) {
  if (ticket.lifecycleStatus === "transferred") {
    return (
      <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-900 ring-1 ring-inset ring-orange-300/70">
        Verplaatst
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/60">
      Actief
    </span>
  );
}

function TransferDestinationBlock({ ticket }: { ticket: EventTicketRow }) {
  if (!ticket.transferDestination) return null;

  const dest = ticket.transferDestination;

  return (
    <div className="mt-2 max-w-md rounded-xl border border-orange-200/80 bg-orange-50/70 px-3 py-2 text-xs text-orange-950">
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
        href={adminPath(`/events/${dest.eventId}/edit`)}
        className="mt-1.5 inline-block font-medium text-orange-900 underline-offset-2 hover:underline"
      >
        Open doeltafel
      </Link>
    </div>
  );
}

function TicketRow({
  ticket,
  eventId,
  targets,
  onChanged,
}: {
  ticket: EventTicketRow;
  eventId: string;
  targets: TransferTargetEvent[];
  onChanged: () => void;
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

  return (
    <tr
      className={`border-b border-border-subtle/60 last:border-0 ${
        isTransferred ? "bg-orange-50/50" : ""
      }`}
    >
      <td className="py-3 pr-4">
        <p className="font-medium text-wine">{guestLabel(ticket)}</p>
        {ticket.dietaryNotes ? (
          <p className="mt-0.5 text-xs text-wine/50">{ticket.dietaryNotes}</p>
        ) : null}
      </td>
      <td className="py-3 pr-4 text-wine/75">{ticket.email}</td>
      <td className="py-3 pr-4 font-mono text-xs text-wine/60">
        {ticket.reservationCode}
      </td>
      <td className="py-3 pr-4 text-wine/75">{ticket.seats}</td>
      <td className="py-3 pr-4">
        <TicketStatusBadge ticket={ticket} />
        {isTransferred ? <TransferDestinationBlock ticket={ticket} /> : null}
      </td>
      <td className="py-3">
        {isTransferred ? (
          <p className="text-xs text-wine/50">
            Alleen ter referentie — telt niet mee voor bezetting.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={isPending || eligibleTargets.length === 0}
                className="min-w-[180px] flex-1 rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10 disabled:opacity-50"
                aria-label={`Verplaats ${guestLabel(ticket)}`}
              >
                <option value="">
                  {eligibleTargets.length === 0
                    ? "Geen tafel met plek"
                    : "Verplaats naar…"}
                </option>
                {eligibleTargets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.nameNl} · {target.city} ·{" "}
                    {formatEventDate(target.startsAt)} ({target.spotsAvailable}{" "}
                    vrij)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!targetId || isPending}
                className="shrink-0 rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Verplaats
              </button>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isPending}
                className="shrink-0 rounded-full border border-border-subtle px-4 py-1.5 text-sm font-medium text-wine/75 transition hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mail opnieuw
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="shrink-0 rounded-full border border-red-800/25 px-4 py-1.5 text-sm font-medium text-red-900 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Bezig…" : "Verwijder"}
              </button>
            </div>
            {error ? (
              <p className="text-xs text-red-800">{error}</p>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  );
}

export function EventTicketsPanel({
  eventId,
  tickets,
  transferTargets,
  spotsSold,
  capacity,
}: {
  eventId: string;
  tickets: EventTicketRow[];
  transferTargets: TransferTargetEvent[];
  spotsSold: number;
  capacity: number;
}) {
  const router = useRouter();
  const activeCount = tickets.filter((t) => t.lifecycleStatus === "active").length;
  const transferredCount = tickets.filter(
    (t) => t.lifecycleStatus === "transferred",
  ).length;

  return (
    <div className="space-y-5">
      <p className="text-sm text-wine/60">
        {spotsSold}/{capacity} plekken bezet · {activeCount} actief
        {transferredCount > 0
          ? ` · ${transferredCount} verplaatst (historisch)`
          : ""}
      </p>

      {tickets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-subtle bg-cream/50 px-4 py-8 text-center text-sm text-wine/55">
          Nog geen bevestigde tickets voor deze tafel.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle/80 bg-cream/40">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 text-xs font-medium uppercase tracking-[0.06em] text-wine/45">
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Plekken</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Acties</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  eventId={eventId}
                  targets={transferTargets}
                  onChanged={() => router.refresh()}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
