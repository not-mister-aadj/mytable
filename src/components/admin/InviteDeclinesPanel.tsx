"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setInviteDeclineAction } from "@/app/admin/(dashboard)/customers/invite-decline-actions";

type Row = { eventId: string; city: string; startsAt: string; declined: { source: "mail" | "admin" } | null };

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).replace(/\./g, "");

/** "Kan niet" on a customer profile: per coming Sunday, set or take back. */
export function InviteDeclinesPanel({ customerId, email, rows }: { customerId: string; email: string; rows: Row[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(row: Row) {
    setError(null);
    setBusy(row.eventId);
    startTransition(async () => {
      const result = await setInviteDeclineAction(customerId, email, row.eventId, !row.declined);
      setBusy(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">Kan niet</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-wine/55">-</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.eventId} className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-wine/80">
                {dayLabel(row.startsAt)} · {row.city}
                {row.declined ? <span className="ml-2 text-xs text-wine/45">{row.declined.source === "mail" ? "via mail" : "door ons"}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => toggle(row)}
                disabled={busy === row.eventId}
                className={
                  row.declined
                    ? "inline-flex min-h-7 items-center rounded-full bg-burgundy px-3 text-xs font-semibold text-cream disabled:opacity-50"
                    : "inline-flex min-h-7 items-center rounded-full border border-border-subtle px-3 text-xs font-semibold text-wine/70 transition hover:border-burgundy/40 hover:text-burgundy disabled:opacity-50"
                }
              >
                {row.declined ? "Kan niet ✓" : "Kan niet"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}
