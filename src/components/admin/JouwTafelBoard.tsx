"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type DragEvent } from "react";
import {
  addEventVenueAction,
  addGroupAction,
  assignBookingAction,
  openForEveryoneNowAction,
  removeEventVenueAction,
  removeGroupAction,
  setGroupsFinalAction,
} from "@/app/admin/(dashboard)/jouw-tafel/[id]/actions";
import { GROUP_TARGET, ageBand, groupLabel, groupWarning } from "@/lib/jouw-tafel/groups-logic";
import type { BoardGuest, EventBoard } from "@/lib/jouw-tafel/groups-server";

const UNASSIGNED = "unassigned";

const button =
  "inline-flex min-h-9 items-center rounded-full bg-burgundy px-4 text-xs font-semibold uppercase tracking-[0.1em] text-cream transition hover:bg-wine disabled:opacity-50";
const ghost =
  "inline-flex min-h-9 items-center rounded-full border border-border-subtle px-3.5 text-xs font-semibold text-wine/70 transition hover:border-burgundy/40 hover:text-burgundy disabled:opacity-50";
const field = "rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine outline-none focus:border-burgundy/40";

/** "zondag 1 november om 14:00". */
function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

const STATE_LABEL = {
  not_yet: "Nog niet te boeken",
  bookable: "Boekbaar",
  full: "Vol",
  closed: "Gesloten (geen boekingen)",
} as const;

export function JouwTafelBoard({
  board,
  calendarHref,
  tablePageHref,
}: {
  board: EventBoard;
  calendarHref: string;
  tablePageHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Optimistic assignments: bookingId -> groupId (or null).
  const [moved, setMoved] = useState<Record<string, string | null>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [newVenue, setNewVenue] = useState(board.venueChoices[0]?.id ?? "");
  const { event } = board;

  const groupOf = (g: BoardGuest) => (g.bookingId in moved ? moved[g.bookingId] : g.groupId);
  const venueName = useMemo(() => new Map(board.venues.map((v) => [v.id, v.name])), [board.venues]);
  const groupOptions = board.groups.map((g) => ({ id: g.id, label: groupLabel(venueName.get(g.venueId) ?? "Zaak", g.number) }));
  const byGroup = (groupId: string | null) => board.guests.filter((g) => (groupOf(g) ?? null) === groupId);
  const seatsIn = (groupId: string | null) => byGroup(groupId).reduce((n, g) => n + g.seats, 0);
  const unassignedSeats = seatsIn(null);

  function run(action: () => Promise<void>, revert?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        revert?.();
        setError(e instanceof Error ? e.message : "Opslaan lukte niet.");
      }
    });
  }

  function assign(bookingId: string, groupId: string | null) {
    const before = moved;
    setMoved((m) => ({ ...m, [bookingId]: groupId }));
    run(() => assignBookingAction(event.id, bookingId, groupId), () => setMoved(before));
  }

  function onDrop(e: DragEvent, target: string) {
    e.preventDefault();
    setDragOver(null);
    const bookingId = e.dataTransfer.getData("text/plain");
    if (bookingId) assign(bookingId, target === UNASSIGNED ? null : target);
  }

  function dropZone(target: string) {
    return {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        if (dragOver !== target) setDragOver(target);
      },
      onDragLeave: () => setDragOver((t) => (t === target ? null : t)),
      onDrop: (e: DragEvent) => onDrop(e, target),
    };
  }

  function guestCard(g: BoardGuest) {
    const band = ageBand(g.age);
    const current = groupOf(g) ?? UNASSIGNED;
    return (
      <li
        key={g.bookingId}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", g.bookingId)}
        className="cursor-grab rounded-xl border border-border-subtle/80 bg-white p-3 shadow-[0_1px_3px_rgba(43,13,18,0.05)] active:cursor-grabbing"
      >
        <p className="text-sm font-semibold text-wine">
          {g.name}
          {g.seats > 1 ? <span className="font-normal text-wine/55"> + {g.seats - 1}</span> : null}
        </p>
        {g.ladies ? (
          <p className="mt-1">
            <span className="rounded-full bg-rose/20 px-2 py-0.5 text-[11px] font-semibold text-rose-deep">
              {g.ladies === "mixed_ok" ? "Ladies only · mixed mag" : "Ladies only"}
            </span>
          </p>
        ) : null}
        <p className="mt-1 flex flex-wrap gap-1 text-[11px] text-wine/60">
          <span className="rounded-full bg-cream px-2 py-0.5">{g.member ? "Lid" : "Ticket"}</span>
          {g.firstTime ? <span className="rounded-full bg-cream px-2 py-0.5">Eerste keer</span> : null}
          {band ? <span className="rounded-full bg-cream px-2 py-0.5">{band}</span> : null}
          {g.language ? <span className="rounded-full bg-cream px-2 py-0.5">{g.language}</span> : null}
          {g.dietary ? <span className="rounded-full bg-cream px-2 py-0.5">{g.dietary}</span> : null}
        </p>
        <select
          value={current}
          onChange={(e) => assign(g.bookingId, e.target.value === UNASSIGNED ? null : e.target.value)}
          className="mt-2 w-full rounded-lg border border-border-subtle bg-cream px-2 py-1 text-xs text-wine"
          aria-label={`Verplaats ${g.name} naar`}
        >
          <option value={UNASSIGNED}>Nog niet ingedeeld</option>
          {groupOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </li>
    );
  }

  function column(id: string, title: string, seats: number, extra?: React.ReactNode, showTarget = true) {
    const warning = id === UNASSIGNED ? null : groupWarning(seats);
    const guests = byGroup(id === UNASSIGNED ? null : id);
    const ladies = guests.filter((g) => g.ladies).length;
    return (
      <div
        key={id}
        {...dropZone(id)}
        className={`flex w-60 shrink-0 flex-col rounded-2xl border p-3 transition ${
          dragOver === id ? "border-burgundy/50 bg-burgundy/5" : "border-border-subtle/80 bg-cream/60"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-wine">{title}</p>
          {extra}
        </div>
        <p className={`mt-0.5 text-xs ${warning ? "font-semibold text-burgundy" : "text-wine/55"}`}>
          {seats}
          {showTarget ? ` / ${GROUP_TARGET}` : ""} {seats === 1 ? "persoon" : "personen"}
          {warning === "too_big" ? " · te groot" : warning === "too_small" ? " · te klein" : ""}
        </p>
        {ladies > 0 ? <p className="text-xs font-semibold text-rose-deep">{ladies} ladies only</p> : null}
        <ul className="mt-3 flex min-h-16 flex-col gap-2">{guests.map(guestCard)}</ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={calendarHref} className="text-xs font-semibold text-wine/55 hover:text-burgundy">
            ← Kalender
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-burgundy">
            {event.city} · {formatWhen(event.startsAt)}
          </h1>
          <p className="mt-1 text-sm text-wine/65">
            {event.spotsSold} / {event.capacity} geboekt · {STATE_LABEL[event.state]} ·{" "}
            <a href={tablePageHref} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              tafelpagina
            </a>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {event.finalAt ? (
            <>
              <span className="rounded-full bg-wine px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cream">
                Definitief
              </span>
              <button type="button" className={ghost} disabled={pending} onClick={() => run(() => setGroupsFinalAction(event.id, false))}>
                Terug naar concept
              </button>
            </>
          ) : (
            <button
              type="button"
              className={button}
              disabled={pending || board.groups.length === 0}
              onClick={() => run(() => setGroupsFinalAction(event.id, true))}
            >
              Maak definitief
            </button>
          )}
          {/* Also reopens a table that closed because nobody booked it. */}
          {(!event.openForEveryone || event.state === "closed") && event.state !== "full" ? (
            <button
              type="button"
              className={ghost}
              disabled={pending}
              onClick={() => {
                if (window.confirm("Deze tafel nu voor iedereen boekbaar maken, zonder voorrang voor leden?")) {
                  run(() => openForEveryoneNowAction(event.id));
                }
              }}
            >
              Nu boekbaar maken
            </button>
          ) : null}
          {unassignedSeats > 0 && !event.finalAt ? (
            <p className="text-xs text-wine/55">{unassignedSeats} nog niet ingedeeld</p>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-xl bg-burgundy/10 px-4 py-2 text-sm text-burgundy">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {board.venueChoices.length > 0 ? (
          <>
            <select value={newVenue} onChange={(e) => setNewVenue(e.target.value)} className={field} aria-label="Zaak toevoegen">
              {board.venueChoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={button}
              disabled={pending || !newVenue}
              onClick={() => run(() => addEventVenueAction(event.id, newVenue))}
            >
              Zaak toevoegen
            </button>
          </>
        ) : (
          <p className="text-sm text-wine/55">
            Geen (andere) zaken in {event.city}. Voeg ze toe onder Venues.
          </p>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {column(UNASSIGNED, "Nog niet ingedeeld", unassignedSeats, undefined, false)}
        {board.venues.map((venue) => {
          const groups = board.groups.filter((g) => g.venueId === venue.id);
          return (
            <section key={venue.id} className="shrink-0 rounded-3xl border border-border-subtle/60 p-3">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="font-serif text-lg text-burgundy">{venue.name}</p>
                  {venue.address ? <p className="text-xs text-wine/50">{venue.address}</p> : null}
                </div>
                <div className="flex gap-1.5">
                  <button type="button" className={ghost} disabled={pending} onClick={() => run(() => addGroupAction(event.id, venue.id))}>
                    + Groep
                  </button>
                  <button
                    type="button"
                    className={ghost}
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`${venue.name} weghalen? De gasten gaan terug naar "nog niet ingedeeld".`)) {
                        run(() => removeEventVenueAction(event.id, venue.id));
                      }
                    }}
                  >
                    Weghalen
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                {groups.map((g) =>
                  column(
                    g.id,
                    groupLabel(venue.name, g.number),
                    seatsIn(g.id),
                    <button
                      type="button"
                      aria-label={`${groupLabel(venue.name, g.number)} weghalen`}
                      className="text-sm text-wine/40 hover:text-burgundy"
                      disabled={pending}
                      onClick={() => run(() => removeGroupAction(event.id, g.id))}
                    >
                      ×
                    </button>,
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>

      {board.guests.length === 0 ? <p className="text-sm text-wine/55">Nog geen boekingen.</p> : null}
    </div>
  );
}
