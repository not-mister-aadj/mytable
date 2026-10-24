"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { saveVenuePicksAction } from "@/app/admin/(dashboard)/jouw-tafel/[id]/actions";
import type { BoardGuest } from "@/lib/jouw-tafel/groups-server";
import { MAX_PICKS, PICK_KINDS, PICK_KIND_LABEL, emptyPick, type VenuePick } from "@/lib/venue-picks";

const LANGUAGE_LABEL: Record<string, string> = {
  both_fine: "NL of EN",
  prefer_dutch: "Nederlands",
  prefer_english: "Engels",
  dutch: "Nederlands",
  english: "Engels",
  both: "NL of EN",
};

export function languageLabel(value: string | null): string | null {
  return value ? (LANGUAGE_LABEL[value] ?? value) : null;
}

const STYLE_LABEL: Record<string, string> = { talker: "Prater", listener: "Luisteraar", both: "Allebei" };
const WINE_LABEL: Record<string, string> = { red: "Rood", white: "Wit", bubbles: "Bubbels" };

function Drawer({ open, onClose, eyebrow, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Sluiten"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-wine/20 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border-subtle bg-cream shadow-[-20px_0_60px_rgba(43,13,18,0.12)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">{eyebrow}</p>
                <h2 className="mt-1 truncate font-serif text-2xl text-burgundy">{title}</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-full px-2 text-xl leading-none text-wine/50 hover:text-burgundy" aria-label="Sluiten">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <div className="border-t border-border-subtle px-6 py-4">{footer}</div> : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-32 shrink-0 text-wine/50">{label}</dt>
      <dd className="min-w-0 break-words text-wine">{value}</dd>
    </div>
  );
}

/** Everything a guest told us, for the seating. */
export function GuestDrawer({ guest, groupLabel, tablePageHref, onClose }: {
  guest: BoardGuest | null;
  groupLabel: string | null;
  tablePageHref: string | null;
  onClose: () => void;
}) {
  const g = guest;
  const intro = g?.intro;
  const status = !intro?.answered ? "Nog niet ingevuld" : intro.shared ? "Ingevuld en gedeeld" : "Ingevuld, niet gedeeld";
  return (
    <Drawer open={Boolean(g)} onClose={onClose} eyebrow={groupLabel ?? "Nog niet ingedeeld"} title={g ? g.name + (g.seats > 1 ? ` + ${g.seats - 1}` : "") : ""}>
      {g && intro ? (
        <div className="space-y-6">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gold">Intro</p>
            <p
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                !intro.answered
                  ? "bg-amber-50 text-amber-900 ring-amber-200/80"
                  : intro.shared
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70"
                    : "bg-wine/[0.05] text-wine/70 ring-border-subtle"
              }`}
            >
              {status}
            </p>
            {intro.answered ? (
              <dl className="mt-3 divide-y divide-border-subtle/70">
                <Fact label="Aan tafel" value={intro.conversationStyle ? (STYLE_LABEL[intro.conversationStyle] ?? intro.conversationStyle) : "–"} />
                <Fact label="Vraag me over" value={intro.askMeAbout ?? "–"} />
                <Fact label="Favoriete plek" value={intro.favoriteSpot ?? "–"} />
                <Fact label="Into" value={intro.intoNow ?? "–"} />
                <Fact label="Wijn" value={intro.wine ? (WINE_LABEL[intro.wine] ?? intro.wine) : "–"} />
                {g.seats > 1 ? <Fact label="+1" value={g.plusOneName ?? "–"} /> : null}
              </dl>
            ) : null}
          </section>
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gold">Gast</p>
            <dl className="mt-2 divide-y divide-border-subtle/70">
              <Fact label="Leeftijd" value={g.age ?? "–"} />
              <Fact label="Leeftijd aan tafel" value={g.agePreference === "similar" ? "Rond eigen leeftijd" : g.agePreference === "any" ? "Alle leeftijden" : "–"} />
              <Fact label="Taal" value={languageLabel(g.language) ?? "–"} />
              <Fact label="Dieet" value={g.dietary ?? "–"} />
              <Fact label="Ladies only" value={g.ladies === "strict" ? "Ja" : g.ladies === "mixed_ok" ? "Ja, mixed mag" : "–"} />
              <Fact label="Ticket" value={g.member ? "Lid" : "Los ticket"} />
              <Fact label="Eerder geweest" value={g.firstTime ? "Eerste keer" : "Ja"} />
              <Fact label="E-mail" value={g.email} />
            </dl>
          </section>
          {tablePageHref ? (
            <a href={tablePageHref} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-burgundy hover:underline">
              Tafelpagina van deze gast openen
            </a>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}

const input =
  "mt-1 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10";

/** Our picks for one venue: every Sunday there shows them. */
export function VenuePicksDrawer({ eventId, venue, onClose, onSaved }: {
  eventId: string;
  venue: { id: string; name: string; picks: VenuePick[] } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Drawer open={Boolean(venue)} onClose={onClose} eyebrow="Aanraders" title={venue?.name ?? ""}>
      {venue ? <PicksForm key={venue.id} eventId={eventId} venue={venue} onClose={onClose} onSaved={onSaved} /> : null}
    </Drawer>
  );
}

function PicksForm({ eventId, venue, onClose, onSaved }: {
  eventId: string;
  venue: { id: string; name: string; picks: VenuePick[] };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [picks, setPicks] = useState<VenuePick[]>(() =>
    venue.picks.length ? venue.picks : [emptyPick("bubbles"), emptyPick("white"), emptyPick("red"), emptyPick("food")],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<VenuePick>) => setPicks((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i: number, d: -1 | 1) =>
    setPicks((ps) => {
      const next = [...ps];
      const [item] = next.splice(i, 1);
      next.splice(i + d, 0, item!);
      return next;
    });
  const named = picks.filter((p) => p.name.trim()).length;

  return (
    <div className="flex min-h-full flex-col">
      <ol className="flex-1 space-y-4">
        {picks.map((p, i) => (
          <li key={i} className="rounded-2xl border border-border-subtle bg-beige/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-serif text-lg text-gold">{i + 1}</span>
              <div className="flex gap-1">
                <button type="button" aria-label="Omhoog" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-full px-2 text-wine/50 hover:text-burgundy disabled:opacity-30">
                  ↑
                </button>
                <button type="button" aria-label="Omlaag" disabled={i === picks.length - 1} onClick={() => move(i, 1)} className="rounded-full px-2 text-wine/50 hover:text-burgundy disabled:opacity-30">
                  ↓
                </button>
                <button type="button" aria-label="Verwijderen" onClick={() => setPicks((ps) => ps.filter((_, j) => j !== i))} className="rounded-full px-2 text-wine/50 hover:text-burgundy">
                  ×
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PICK_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => update(i, { kind: k })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    p.kind === k ? "bg-wine text-cream" : "bg-white text-wine/70 ring-1 ring-border-subtle hover:text-wine"
                  }`}
                >
                  {PICK_KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-wine/60 sm:col-span-2">
                Naam
                <input className={input} value={p.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Crémant de Loire" />
              </label>
              <label className="block text-xs font-medium text-wine/60">
                Moment
                <input className={input} value={p.moment} onChange={(e) => update(i, { moment: e.target.value })} placeholder="Om mee te beginnen" />
              </label>
              <label className="block text-xs font-medium text-wine/60">
                Labels
                <input className={input} value={p.tags} onChange={(e) => update(i, { tags: e.target.value })} placeholder="Loire, Frankrijk · per glas" />
              </label>
              <label className="block text-xs font-medium text-wine/60 sm:col-span-2">
                Waarom
                <textarea rows={3} className={input} value={p.why} onChange={(e) => update(i, { why: e.target.value })} placeholder="Droog en fris, met een beetje brioche." />
              </label>
              <label className="block text-xs font-medium text-wine/60 sm:col-span-2">
                Bijpassende spijs
                <input className={input} value={p.goesWith} onChange={(e) => update(i, { goesWith: e.target.value })} placeholder="Pastel de bacalhau" />
              </label>
            </div>
          </li>
        ))}
      </ol>
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-5 flex items-center justify-between gap-3 border-t border-border-subtle bg-cream px-6 py-4">
        <button
          type="button"
          disabled={picks.length >= MAX_PICKS}
          onClick={() => setPicks((ps) => [...ps, emptyPick()])}
          className="rounded-full border border-border-subtle px-3.5 py-1.5 text-sm font-medium text-wine transition hover:border-burgundy/40 disabled:opacity-40"
        >
          + Aanrader
        </button>
        <div className="flex items-center gap-3">
          {error ? <span className="text-sm text-red-800">{error}</span> : null}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await saveVenuePicksAction(eventId, venue.id, picks);
                  onSaved();
                  onClose();
                } catch {
                  setError("Opslaan lukte niet.");
                }
              })
            }
            className="rounded-full bg-burgundy px-5 py-2 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
          >
            {pending ? "Opslaan…" : `Opslaan (${named})`}
          </button>
        </div>
      </div>
    </div>
  );
}
