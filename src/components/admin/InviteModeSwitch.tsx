"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInviteMode } from "@/app/admin/(dashboard)/invites/actions";

export function InviteModeSwitch({ mode, dueNow, enabled }: { mode: "manual" | "auto"; dueNow: number; enabled: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const save = (next: "manual" | "auto") =>
    startTransition(async () => {
      await setInviteMode(next);
      setConfirming(false);
      router.refresh();
    });

  const option = (value: "manual" | "auto", label: string) => (
    <button
      type="button"
      disabled={busy}
      aria-pressed={mode === value}
      onClick={() => (mode === value ? null : value === "auto" ? setConfirming(true) : save("manual"))}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${mode === value ? "bg-burgundy text-cream" : "text-wine/70 hover:text-burgundy"}`}
    >
      {value === "auto" ? <span className={`h-2 w-2 rounded-full ${mode === "auto" ? "bg-emerald-400" : "bg-wine/30"}`} /> : null}
      {label}
    </button>
  );

  return (
    <>
      <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-sm">
        {option("manual", "Handmatig")}
        {option("auto", "Automatisch")}
      </div>
      {confirming ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4" onClick={() => !busy && setConfirming(false)}>
          <div className="w-full max-w-md rounded-2xl bg-beige p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-xl text-burgundy">Automatisch</p>
            <p className="mt-2 text-sm text-wine/80">
              {enabled
                ? `Alle geplande mails gaan vanaf nu vanzelf uit op hun tijdstip, zonder goedkeuring.${dueNow > 0 ? ` ${dueNow === 1 ? "1 mail is" : `${dueNow} mails zijn`} al aan de beurt en ${dueNow === 1 ? "gaat" : "gaan"} binnen een minuut uit.` : ""}`
                : "Na Start gaan geplande mails vanzelf uit op hun tijdstip, zonder goedkeuring."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm text-wine">
                Annuleren
              </button>
              <button type="button" disabled={busy} onClick={() => save("auto")} className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream">
                {busy ? "Bezig…" : "Zet op automatisch"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
