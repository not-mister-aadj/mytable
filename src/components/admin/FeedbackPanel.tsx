"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setFeedbackUsedAction } from "@/app/admin/(dashboard)/events/[id]/guests/feedback-actions";

export type FeedbackRow = {
  id: string;
  name: string;
  group: number | null;
  mood: string | null;
  venueMood: string | null;
  highlight: string | null;
  improve: string | null;
  quoteConsent: boolean;
  photoUrl: string | null;
  contactOk: boolean;
  email: string;
  wantToSee: string[];
  used: boolean;
};

const MOOD: Record<string, { label: string; dot: string }> = {
  great: { label: "Geweldig", dot: "bg-[#1f9d55]" },
  good: { label: "Leuk", dot: "bg-[#8cc795]" },
  meh: { label: "Matig", dot: "bg-[#e9a2a2]" },
  bad: { label: "Niet leuk", dot: "bg-[#d64550]" },
};

function MoodChip({ mood }: { mood: string | null }) {
  const m = mood ? MOOD[mood] : null;
  if (!m) return <span className="text-wine/40">–</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-wine">
      <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/** Everything guests said about one Sunday, quotes they let us use first. */
export function FeedbackPanel({ eventId, venueName, rows, guests }: { eventId: string; venueName: string | null; rows: FeedbackRow[]; guests: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const count = (key: "mood" | "venueMood", v: string) => rows.filter((r) => r[key] === v).length;
  const sorted = [...rows].sort((a, b) => Number(b.quoteConsent) - Number(a.quoteConsent));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-beige/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">Ingevuld</p>
          <p className="mt-1 font-serif text-2xl text-burgundy">
            {rows.length} / {guests}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-beige/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">Middag</p>
          <div className="mt-2 space-y-1 text-sm">
            {Object.keys(MOOD).map((k) => (
              <div key={k} className="flex justify-between">
                <MoodChip mood={k} />
                <span className="tabular-nums text-wine/70">{count("mood", k)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-beige/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">{venueName ?? "Zaak"}</p>
          <div className="mt-2 space-y-1 text-sm">
            {Object.keys(MOOD).map((k) => (
              <div key={k} className="flex justify-between">
                <MoodChip mood={k} />
                <span className="tabular-nums text-wine/70">{count("venueMood", k)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sorted.length === 0 ? <p className="text-sm text-wine/55">Nog geen feedback.</p> : null}
      <ul className="space-y-3">
        {sorted.map((r) => (
          <li key={r.id} className="rounded-xl border border-border-subtle bg-beige/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-wine/10" />
                ) : null}
                <div>
                  <p className="font-semibold text-wine">
                    {r.name}
                    {r.group !== null ? <span className="font-normal text-wine/50"> · groep {r.group}</span> : null}
                  </p>
                  <p className="text-sm">
                    <MoodChip mood={r.mood} />
                    <span className="mx-2 text-wine/25">·</span>
                    <span className="text-wine/50">zaak </span>
                    <MoodChip mood={r.venueMood} />
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {r.quoteConsent ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => start(async () => {
                      await setFeedbackUsedAction(eventId, r.id, !r.used);
                      router.refresh();
                    })}
                    className={`rounded-full px-3 py-1 font-semibold transition ${
                      r.used ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-burgundy text-cream hover:bg-burgundy/90"
                    }`}
                  >
                    {r.used ? "Gebruikt ✓" : "Gebruiken"}
                  </button>
                ) : (
                  <span className="rounded-full bg-wine/[0.05] px-3 py-1 text-wine/50">Niet citeren</span>
                )}
                {r.contactOk ? <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-900">Wil contact · {r.email}</span> : null}
              </div>
            </div>
            {r.highlight ? <p className="mt-3 text-sm text-wine">“{r.highlight}”</p> : null}
            {r.improve ? (
              <p className="mt-2 text-sm text-wine/70">
                <span className="font-medium text-wine/50">Beter: </span>
                {r.improve}
              </p>
            ) : null}
            {r.wantToSee.length > 0 ? <p className="mt-2 text-xs text-wine/55">Wil vaker zien: {r.wantToSee.join(", ")}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
