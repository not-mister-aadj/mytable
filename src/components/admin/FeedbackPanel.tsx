"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setFeedbackUsedAction } from "@/app/admin/(dashboard)/events/[id]/guests/feedback-actions";
import { markBookingNoShowAction } from "@/app/admin/(dashboard)/events/actions";
import { DISLIKED_LABELS, LIKED_LABELS, type DislikedReason, type LikedReason } from "@/lib/feedback-reasons";

export type MissingGuest = { bookingId: string; name: string; by: string[]; noShow: boolean };

export type FeedbackRow = {
  id: string;
  name: string;
  group: number | null;
  mood: string | null;
  venueMood: string | null;
  liked: LikedReason[];
  highlight: string | null;
  disliked: DislikedReason[];
  improve: string | null;
  quoteConsent: boolean;
  photoUrl: string | null;
  contactOk: boolean;
  email: string;
  wantToSee: string[];
  used: boolean;
  /** Reached the last screen (saw the next Sunday or the offer). */
  completed: boolean;
};

const MOOD: Record<string, { label: string; dot: string }> = {
  great: { label: "Geweldig", dot: "bg-[#1f9d55]" },
  good: { label: "Leuk", dot: "bg-[#8cc795]" },
  meh: { label: "Matig", dot: "bg-[#e9a2a2]" },
  bad: { label: "Niet leuk", dot: "bg-[#d64550]" },
};

/** How often each reason was tapped, most first. */
function ReasonCounts({ title, counts }: { title: string; counts: [string, number][] }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-beige/60 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">{title}</p>
      <div className="mt-2 space-y-1 text-sm">
        {counts.length === 0 ? <span className="text-wine/40">–</span> : null}
        {counts.map(([label, n]) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="text-wine">{label}</span>
            <span className="tabular-nums text-wine/70">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function tally<K extends string>(lists: K[][], labels: Record<K, string>): [string, number][] {
  const n = new Map<K, number>();
  for (const list of lists) for (const k of list) n.set(k, (n.get(k) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).map(([k, c]) => [labels[k] ?? k, c]);
}

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
export function FeedbackPanel({
  eventId,
  venueName,
  rows,
  guests,
  missing,
}: {
  eventId: string;
  venueName: string | null;
  rows: FeedbackRow[];
  guests: number;
  missing: MissingGuest[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const count = (key: "mood" | "venueMood", v: string) => rows.filter((r) => r[key] === v).length;
  const sorted = [...rows].sort((a, b) => Number(b.quoteConsent) - Number(a.quoteConsent));
  const likedCounts = tally(rows.map((r) => r.liked), LIKED_LABELS.nl);
  const dislikedCounts = tally(rows.map((r) => r.disliked), DISLIKED_LABELS.nl);

  return (
    <div className="space-y-5">
      {missing.length > 0 ? (
        <section className="rounded-xl border border-border-subtle bg-beige/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">Niet gezien</p>
          <ul className="mt-2 space-y-2">
            {missing.map((m) => (
              <li key={m.bookingId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-wine">
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-wine/55"> · volgens {m.by.join(", ")}</span>
                </span>
                {m.noShow ? (
                  <span className="rounded-full bg-wine/[0.05] px-3 py-1 text-xs text-wine/60">Niet gekomen ✓</span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await markBookingNoShowAction(m.bookingId);
                        router.refresh();
                      })
                    }
                    className="rounded-full bg-burgundy px-3 py-1 text-xs font-semibold text-cream hover:bg-burgundy/90"
                  >
                    Niet gekomen
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
      {likedCounts.length > 0 || dislikedCounts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ReasonCounts title="Leuk aan" counts={likedCounts} />
          <ReasonCounts title="Kan beter" counts={dislikedCounts} />
        </div>
      ) : null}

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
                ) : null}
                {!r.completed ? <span className="rounded-full bg-wine/[0.05] px-3 py-1 text-wine/50">Niet afgemaakt</span> : null}
                {r.contactOk ? <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-900">Wil contact · {r.email}</span> : null}
              </div>
            </div>
            {r.liked.length > 0 ? (
              <p className="mt-3 text-sm text-wine">
                <span className="font-medium text-wine/50">Leuk: </span>
                {r.liked.map((k) => LIKED_LABELS.nl[k]).join(", ")}
              </p>
            ) : null}
            {r.highlight ? <p className="mt-2 text-sm text-wine">“{r.highlight}”</p> : null}
            {r.disliked.length > 0 ? (
              <p className="mt-2 text-sm text-wine/70">
                <span className="font-medium text-wine/50">Kan beter: </span>
                {r.disliked.map((k) => DISLIKED_LABELS.nl[k]).join(", ")}
              </p>
            ) : null}
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
