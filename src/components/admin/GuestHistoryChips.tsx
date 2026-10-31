"use client";

import { createContext, useContext } from "react";
import type { GuestHistory } from "@/lib/admin/table-history";

/** Per booking id on this Sunday: what we know from earlier Sundays. */
export const GuestHistoryContext = createContext<Record<string, GuestHistory>>({});

/** For a server page: hands the labels to whatever lists guests inside it. */
export function GuestHistoryProvider({ value, children }: { value: Record<string, GuestHistory>; children: React.ReactNode }) {
  return <GuestHistoryContext.Provider value={value}>{children}</GuestHistoryContext.Provider>;
}

const MOOD: Record<string, string> = { great: "Geweldig", good: "Leuk", meh: "Matig", bad: "Niet leuk" };

const chip = "rounded-full px-2 py-0.5 text-[11px] font-semibold";

/** "3e keer · vorige: Leuk", who here they want to see, and red when someone here reported them or was reported by them. */
export function GuestHistoryChips({ bookingId }: { bookingId: string }) {
  const h = useContext(GuestHistoryContext)[bookingId];
  if (!h) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      <span className={`${chip} ${h.before === 0 ? "bg-sky-50 text-sky-900" : "bg-wine/[0.06] text-wine/70"}`}>
        {h.before === 0 ? "Nieuw" : `${h.before + 1}e keer`}
        {h.lastMood ? ` · vorige: ${MOOD[h.lastMood]}` : ""}
      </span>
      {h.wants.map((n) => (
        <span key={`w${n}`} className={`${chip} bg-emerald-50 text-emerald-800`}>
          Wil {n} zien{h.wantedBy.includes(n) ? " ✓" : ""}
        </span>
      ))}
      {h.wantedBy
        .filter((n) => !h.wants.includes(n))
        .map((n) => (
          <span key={`b${n}`} className={`${chip} bg-emerald-50/60 text-emerald-800/80`}>
            Gekozen door {n}
          </span>
        ))}
      {h.reported.map((n) => (
        <span key={`r${n}`} className={`${chip} bg-red-100 text-red-900`}>
          Meldde {n}: niet samen
        </span>
      ))}
      {h.reportedBy.map((n) => (
        <span key={`rb${n}`} className={`${chip} bg-red-100 text-red-900`}>
          Gemeld door {n}: niet samen
        </span>
      ))}
    </span>
  );
}
