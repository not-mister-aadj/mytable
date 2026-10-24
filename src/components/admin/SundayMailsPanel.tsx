"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cancelScheduledSundayMailAction,
  previewSundayMailAction,
  scheduleSundayMailAction,
  sendSundayMailAction,
  sendSundayMailTestAction,
} from "@/app/admin/(dashboard)/events/[id]/guests/mail-actions";

export type MailGuest = {
  bookingId: string;
  name: string;
  groupNumber: number | null;
  needsIntro: boolean;
  sentLocation: boolean;
  sentSaturday: boolean;
  sentMorning: boolean;
};

type Kind = "location" | "saturday" | "morning";

/** A planned send: when ("za 24 okt, 16:00") and for how many guests. */
export type MailPlan = { label: string; count: number } | null;

const COPY: Record<Kind, { title: string; when: string; what: string }> = {
  location: {
    title: "Locatiemail",
    when: "Een week van tevoren",
    what: "De locatie en het adres, hoe de middag gaat, dat zaterdag de groepsmail volgt, en een knop naar de vragen (invullen of aanpassen).",
  },
  saturday: {
    title: "Zaterdagmail",
    when: "De dag ervoor",
    what: "Het groepsnummer om bij binnenkomst te zeggen en een link naar de tafelpagina: wie er aan tafel zitten en wat ze delen.",
  },
  morning: {
    title: "Ochtendmail",
    when: "Zondagochtend",
    what: "Onze aanraders van de zaak, met een link naar de tafelpagina waar staat waarom we ze kozen.",
  },
};

/** The Sunday's guest mails: preview as any guest, test to yourself, then
 * send to everyone who hasn't had it. */
export function SundayMailsPanel({
  eventId,
  guests,
  blockers,
  plans,
  defaultTimes,
}: {
  eventId: string;
  guests: MailGuest[];
  blockers: Record<Kind, string | null>;
  plans: { saturday: MailPlan; morning: MailPlan };
  /** "YYYY-MM-DDTHH:mm" in Amsterdam: Saturday 16:00, Sunday 08:30. */
  defaultTimes: { saturday: string; morning: string };
}) {
  return (
    <div className="space-y-6">
      <MailCard kind="location" eventId={eventId} guests={guests} blocker={blockers.location} />
      <MailCard kind="saturday" eventId={eventId} guests={guests} blocker={blockers.saturday} plan={plans.saturday} defaultTime={defaultTimes.saturday} />
      <MailCard kind="morning" eventId={eventId} guests={guests} blocker={blockers.morning} plan={plans.morning} defaultTime={defaultTimes.morning} />
    </div>
  );
}

function MailCard({
  kind,
  eventId,
  guests,
  blocker,
  plan = null,
  defaultTime,
}: {
  kind: Kind;
  eventId: string;
  guests: MailGuest[];
  blocker: string | null;
  plan?: MailPlan;
  defaultTime?: string;
}) {
  const router = useRouter();
  const copy = COPY[kind];
  const sentOf = (g: MailGuest) => (kind === "location" ? g.sentLocation : kind === "saturday" ? g.sentSaturday : g.sentMorning);
  const sent = guests.filter(sentOf).length;
  const missing = guests.filter((g) => !sentOf(g));

  const [previewFor, setPreviewFor] = useState(guests[0]?.bookingId ?? "");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [planAt, setPlanAt] = useState(defaultTime ?? "");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) =>
    start(async () => {
      const result = await fn();
      setMessage(result.ok ? { ok: true, text: result.message } : { ok: false, text: result.error });
      router.refresh();
    });

  const showPreview = () =>
    start(async () => {
      const result = await previewSundayMailAction(eventId, kind, previewFor);
      if (result.ok) {
        setPreview({ subject: result.subject, html: result.html });
        setMessage(null);
      } else setMessage({ ok: false, text: result.error });
    });

  return (
    <section className="rounded-xl border border-border-subtle bg-beige/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl text-burgundy">{copy.title}</h3>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">{copy.when}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
            plan
              ? "bg-sky-50 text-sky-900 ring-sky-200/80"
              : guests.length > 0 && sent === guests.length
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70"
              : sent > 0
                ? "bg-amber-50 text-amber-900 ring-amber-200/80"
                : "bg-wine/[0.05] text-wine/60 ring-border-subtle"
          }`}
        >
          {plan ? `${plan.count} ingepland` : `${sent} van ${guests.length} verstuurd`}
        </span>
      </div>
      <p className="mt-2 max-w-prose text-sm text-wine/65">{copy.what}</p>

      {plan ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span>
            Ingepland: <strong>{plan.label}</strong> · {plan.count} {plan.count === 1 ? "gast" : "gasten"}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => cancelScheduledSundayMailAction(eventId, kind))}
            className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900 transition hover:border-sky-500 disabled:opacity-50"
          >
            Annuleren
          </button>
        </div>
      ) : null}

      {missing.length > 0 && sent > 0 && !plan ? (
        <p className="mt-2 text-sm text-wine/60">Nog niet: {missing.map((g) => g.name).join(", ")}</p>
      ) : null}

      {blocker ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{blocker}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={previewFor}
          onChange={(e) => setPreviewFor(e.target.value)}
          aria-label="Bekijk als gast"
          className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine"
        >
          {guests.map((g) => (
            <option key={g.bookingId} value={g.bookingId}>
              Als {g.name}
              {kind !== "location" && g.groupNumber !== null ? ` (groep ${g.groupNumber})` : ""}
              {kind === "location" && g.needsIntro ? " (vragen open)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || guests.length === 0}
          onClick={showPreview}
          className="rounded-full border border-border-subtle bg-cream px-3.5 py-1.5 text-sm font-medium text-wine transition hover:border-burgundy/30 disabled:opacity-40"
        >
          Voorbeeld
        </button>
        <button
          type="button"
          disabled={pending || guests.length === 0 || Boolean(blocker)}
          onClick={() => run(() => sendSundayMailTestAction(eventId, kind, previewFor))}
          className="rounded-full border border-border-subtle bg-cream px-3.5 py-1.5 text-sm font-medium text-wine transition hover:border-burgundy/30 disabled:opacity-40"
        >
          Test naar mij
        </button>
        {missing.length > 0 && !plan ? (
          confirming ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  run(() => sendSundayMailAction(eventId, kind));
                }}
                className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
              >
                Ja, verstuur naar {missing.length}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="px-2 text-sm text-wine/60 hover:text-wine">
                Annuleren
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending || Boolean(blocker)}
              onClick={() => setConfirming(true)}
              className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
            >
              Verstuur nu naar {missing.length} {missing.length === 1 ? "gast" : "gasten"}
            </button>
          )
        ) : null}
        {defaultTime && missing.length > 0 && !plan ? (
          planning ? (
            <>
              <input
                type="datetime-local"
                value={planAt}
                onChange={(e) => setPlanAt(e.target.value)}
                aria-label="Verzendmoment"
                className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine"
              />
              <button
                type="button"
                disabled={pending || !planAt}
                onClick={() => {
                  setPlanning(false);
                  run(() => scheduleSundayMailAction(eventId, kind, planAt));
                }}
                className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
              >
                Plan in voor {missing.length}
              </button>
              <button type="button" onClick={() => setPlanning(false)} className="px-2 text-sm text-wine/60 hover:text-wine">
                Annuleren
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending || Boolean(blocker)}
              onClick={() => setPlanning(true)}
              className="rounded-full border border-burgundy/40 bg-cream px-4 py-1.5 text-sm font-medium text-burgundy transition hover:bg-burgundy/5 disabled:opacity-40"
            >
              Inplannen
            </button>
          )
        ) : null}
        {pending ? <span className="text-sm text-wine/50">Bezig…</span> : null}
      </div>

      {message ? (
        <p className={`mt-3 text-sm ${message.ok ? "text-emerald-800" : "text-red-800"}`} role="status">
          {message.text}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-cream px-4 py-2.5">
            <p className="truncate text-sm font-medium text-wine">{preview.subject}</p>
            <button type="button" onClick={() => setPreview(null)} className="text-sm text-wine/60 hover:text-wine">
              Sluiten
            </button>
          </div>
          <iframe title={preview.subject} srcDoc={preview.html} sandbox="" className="h-[640px] w-full" />
        </div>
      ) : null}
    </section>
  );
}
