"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setInvitePauseAction } from "@/app/admin/(dashboard)/customers/invite-pause-actions";

const PREF_LABEL: Record<string, string> = { all: "alle", less: "minder", none: "geen" };

function formatDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

/** "Uitnodigingen" on a customer profile: their city settings and a pause until a date. */
export function InvitePausePanel({
  customerId,
  email,
  cityPrefs,
  pausedUntil,
}: {
  customerId: string;
  email: string;
  cityPrefs: Record<string, "all" | "less" | "none">;
  pausedUntil: string | null;
}) {
  const router = useRouter();
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const running = pausedUntil !== null && pausedUntil > today;
  const prefs = Object.entries(cityPrefs);

  function save(until: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await setInvitePauseAction(customerId, email, until);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDay("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">Uitnodigingen</h2>
      {prefs.length > 0 ? (
        <p className="mt-3 text-sm text-wine/70">{prefs.map(([city, pref]) => `${city} · ${PREF_LABEL[pref] ?? pref}`).join(", ")}</p>
      ) : null}
      {running && pausedUntil ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
            Pauze tot {formatDay(pausedUntil)}
          </span>
          <button
            type="button"
            onClick={() => save(null)}
            disabled={pending}
            className="inline-flex min-h-7 items-center rounded-full border border-border-subtle px-3 text-xs font-semibold text-wine/70 transition hover:border-burgundy/40 hover:text-burgundy disabled:opacity-50"
          >
            Weghalen
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-wine/70" htmlFor="invite-pause-until">
            Pauze tot
          </label>
          <input
            id="invite-pause-until"
            type="date"
            min={today}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-sm text-wine"
          />
          <button
            type="button"
            onClick={() => save(day)}
            disabled={pending || !day}
            className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
          >
            {pending ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}
