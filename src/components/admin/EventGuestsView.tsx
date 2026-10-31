"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  markBookingNoShowAction,
  removeBookingFromEventAction,
  resendBookingConfirmationAction,
  transferBookingToEventAction,
} from "@/app/admin/(dashboard)/events/actions";
import { adminPath } from "@/lib/admin-url";
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
import { EmailPreviewDialog } from "@/components/admin/EmailPreviewDialog";
import { GuestHistoryChips, GuestHistoryContext } from "@/components/admin/GuestHistoryChips";
import type { GuestHistory } from "@/lib/admin/table-history";

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






/** "Lid" on a member's booking (own seat free, guest at member price) and
 * "Niet gekomen" once marked. */
function MemberBadges({ ticket }: { ticket: EventTicketRow }) {
  if (!ticket.isMember && !ticket.noShowAt) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {ticket.isMember ? (
        <span
          title={`Lid: eigen plek inbegrepen, betaald ${ticket.amountLabel}`}
          className="inline-flex rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-[#7d5c2c] ring-1 ring-inset ring-gold/30"
        >
          Lid · {ticket.amountLabel}
        </span>
      ) : null}
      {ticket.noShowAt ? (
        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-900 ring-1 ring-inset ring-red-200">
          Niet gekomen
        </span>
      ) : null}
    </span>
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

const shortDate = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
const longDateTime = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

/** "Vragen ingevuld" when the open questions have an answer, "Deels" when
 * only a click (talker/listener or wine) came in, "Vragen open" otherwise. */
function introState(ticket: EventTicketRow): { label: string; className: string } {
  const { intro } = ticket;
  const open = [intro.askMeAbout, intro.favoriteSpot, intro.intoNow].some((v) => v?.trim());
  const date = intro.answeredAt ? ` · ${shortDate.format(new Date(intro.answeredAt))}` : "";
  if (open) {
    return { label: `Vragen ingevuld${date}`, className: "bg-emerald-50 text-emerald-800 ring-emerald-200/70" };
  }
  if (intro.answeredAt) {
    return { label: `Deels ingevuld${date}`, className: "bg-amber-50 text-amber-900 ring-amber-200/80" };
  }
  return { label: "Vragen open", className: "bg-orange-50 text-orange-900 ring-orange-300/70" };
}

function IntroAnswers({ ticket }: { ticket: EventTicketRow }) {
  const { intro } = ticket;
  const rows = [
    ["Aan tafel", intro.conversationStyle ? (CONVERSATION_STYLE_LABELS[intro.conversationStyle] ?? intro.conversationStyle) : null],
    ["Vraag me over", intro.askMeAbout],
    ["Favoriete plek", intro.favoriteSpot],
    ["Wijn", intro.wine ? (WINE_LABELS[intro.wine] ?? intro.wine) : null],
    ["Nu into", intro.intoNow],
    ["+1", ticket.seats === 2 ? intro.plusOneName : null],
  ] as const;
  const filled = rows.filter(([, value]) => value?.trim());
  return (
    <div className="mt-2 rounded-xl border border-border-subtle bg-cream px-3.5 py-3 text-sm">
      {filled.length > 0 ? (
        <dl className="space-y-1">
          {filled.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-28 shrink-0 text-wine/50">{label}</dt>
              <dd className="text-wine">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-wine/55">Nog niets ingevuld.</p>
      )}
      <p className="mt-2 text-xs text-wine/45">
        Delen met tafelgenoten: {intro.shareConsent ? "ja" : "nee"}
        {intro.requestSentAt ? ` · vragenmail ${shortDate.format(new Date(intro.requestSentAt))}` : ""}
      </p>
    </div>
  );
}

/** Answered or not, and every email this guest got (click for the mail). */
function GuestIntroAndMails({ ticket }: { ticket: EventTicketRow }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [preview, setPreview] = useState<EventTicketRow["emails"][number] | null>(null);
  const state = introState(ticket);

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={() => setShowAnswers((open) => !open)}
        aria-expanded={showAnswers}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition hover:opacity-80 ${state.className}`}
      >
        {state.label}
        <span aria-hidden className="text-[10px]">{showAnswers ? "▲" : "▼"}</span>
      </button>
      {showAnswers ? <IntroAnswers ticket={ticket} /> : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-wine/60">
        <span className="mr-1 text-wine/40">Mails:</span>
        {ticket.emails.length === 0 ? (
          <span className="text-wine/40">nog geen bekend</span>
        ) : (
          ticket.emails.map((mail, i) => (
            <span key={mail.id} className="inline-flex items-center">
              {i > 0 ? <span className="mx-1 text-wine/25">·</span> : null}
              <button
                type="button"
                onClick={() => setPreview(mail)}
                title={`${mail.subject} · ${longDateTime.format(new Date(mail.sentAt))}`}
                className="underline decoration-wine/25 underline-offset-2 transition hover:text-burgundy hover:decoration-burgundy/50"
              >
                {mail.kind} {shortDate.format(new Date(mail.sentAt))}
              </button>
            </span>
          ))
        )}
      </div>

      {preview ? (
        <EmailPreviewDialog
          logId={preview.id}
          subject={preview.subject}
          sentAt={preview.sentAt}
          to={ticket.email}
          onClose={() => setPreview(null)}
        />
      ) : null}
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

  function handleNoShow() {
    const undo = Boolean(ticket.noShowAt);
    const name = guestLabel(ticket);
    const confirmed = confirm(
      undo
        ? `"Niet gekomen" terugdraaien voor ${name}? Een mail die al is verstuurd, blijft verstuurd.`
        : ticket.isMember
          ? `${name} markeren als niet gekomen?

Dit is een lid: de eerste keer krijgt ze een vriendelijke waarschuwing, daarna kan ze een maand niet boeken (het lidmaatschap loopt door). Ze krijgt daar een mail over.`
          : `${name} markeren als niet gekomen?`,
    );
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await markBookingNoShowAction(ticket.id, undo);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.notice) alert(result.notice);
      onChanged();
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
        Alleen ter referentie - telt niet mee voor bezetting.
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
      {ticket.eventStarted ? (
        <button
          type="button"
          onClick={handleNoShow}
          disabled={isPending}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm font-medium text-wine/75 transition hover:border-burgundy/25 hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ticket.noShowAt ? "Toch gekomen" : "Niet gekomen"}
        </button>
      ) : null}
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

/** Moving, resending and removing are rare: they sit behind "…" so the
 * list stays calm. */
function ActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <details className="group relative inline-block text-left">
      <summary
        aria-label="Acties"
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border border-border-subtle bg-cream text-wine/60 transition hover:border-burgundy/30 hover:text-burgundy [&::-webkit-details-marker]:hidden"
      >
        …
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border-subtle bg-beige p-3 shadow-xl">
        {children}
      </div>
    </details>
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
            <GuestHistoryChips bookingId={ticket.id} />
            <p className="mt-0.5 truncate text-sm text-wine/55">{ticket.email}</p>
            <p className="mt-2 font-mono text-xs tracking-wide text-wine/45">
              {ticket.reservationCode}
              <span className="mx-2 text-wine/25">·</span>
              {ticket.seats} {ticket.seats === 1 ? "plek" : "plekken"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <TicketStatusBadge ticket={ticket} />
          <MemberBadges ticket={ticket} />
        </div>
      </div>

      <GuestNotes ticket={ticket} />
      <GuestIntroAndMails ticket={ticket} />
      {isTransferred ? <TransferDestinationBlock ticket={ticket} /> : null}

      <div className="mt-3 flex justify-end">
        <ActionsMenu>
          <GuestActions
            ticket={ticket}
            eventId={eventId}
            targets={targets}
            onChanged={onChanged}
            layout="card"
          />
        </ActionsMenu>
      </div>
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
            <GuestHistoryChips bookingId={ticket.id} />
            <p className="mt-0.5 text-xs text-wine/55">{ticket.email}</p>
            <GuestNotes ticket={ticket} />
            <GuestIntroAndMails ticket={ticket} />
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
        <MemberBadges ticket={ticket} />
        {isTransferred ? <TransferDestinationBlock ticket={ticket} /> : null}
      </td>
      <td className="px-5 py-4 text-right">
        <ActionsMenu>
          <GuestActions
            ticket={ticket}
            eventId={eventId}
            targets={targets}
            onChanged={onChanged}
            layout="inline"
          />
        </ActionsMenu>
      </td>
    </motion.tr>
  );
}

const CONVERSATION_STYLE_LABELS: Record<string, string> = {
  talker: "Prater",
  listener: "Luisteraar",
  both: "Allebei",
};

const WINE_LABELS: Record<string, string> = {
  red: "Rood",
  white: "Wit",
  bubbles: "Bubbels",
};

export function EventGuestsView({
  event,
  tickets,
  transferTargets,
  history,
}: {
  event: EventSummary;
  tickets: EventTicketRow[];
  transferTargets: TransferTargetEvent[];
  /** Labels from earlier Sundays, per booking id. */
  history?: Record<string, GuestHistory>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const activeCount = tickets.filter((t) => t.lifecycleStatus === "active").length;
  const transferredCount = tickets.filter(
    (t) => t.lifecycleStatus === "transferred",
  ).length;

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

  const onChanged = () => router.refresh();

  return (
    <GuestHistoryContext.Provider value={history ?? {}}>
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-wine/60">
          {activeCount} {activeCount === 1 ? "gast" : "gasten"}
          {transferredCount > 0 ? ` · ${transferredCount} verplaatst` : ""}
        </p>
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
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                    <th className="px-5 py-3.5">Gast</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Plekken</th>
                    <th className="px-5 py-3.5">Allergieën</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5"><span className="sr-only">Acties</span></th>
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
    </GuestHistoryContext.Provider>
  );
}
