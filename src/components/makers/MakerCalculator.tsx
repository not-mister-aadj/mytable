"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { makerCopy } from "@/lib/makers/copy";
import { MAKER_COMMISSION_CENTS, makerEstimate } from "@/lib/makers/shared";

/** The extra a maker earns, worked out from how many people book through them per month. */
export function MakerCalculator({ locale }: { locale: Locale }) {
  const t = makerCopy(locale).calc;
  const [perMonth, setPerMonth] = useState(5);
  const e = makerEstimate(perMonth);
  const euro = (cents: number) =>
    `€${new Intl.NumberFormat(locale === "en" ? "en-GB" : "nl-NL", { maximumFractionDigits: 0 }).format(cents / 100)}`;
  const lines: [string, string][] = [
    [t.seats(e.seats), euro(e.seats * MAKER_COMMISSION_CENTS)],
    [t.members(e.members), euro(e.members * 12 * MAKER_COMMISSION_CENTS)],
  ];

  return (
    <div className="grid overflow-hidden rounded-[1.75rem] bg-wine text-cream sm:grid-cols-[1.1fr_1fr]">
      <div className="px-7 py-10 sm:px-12 sm:py-14">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/70">{t.title}</div>
        <label htmlFor="maker-per-month" className="mt-5 block text-[0.95rem] text-cream/75">
          {t.label}
        </label>
        <div className="mt-1 font-serif text-[2.2rem] leading-tight">{t.perMonth(perMonth)}</div>
        <input
          id="maker-per-month"
          type="range"
          min={1}
          max={30}
          value={perMonth}
          onChange={(ev) => setPerMonth(Number(ev.target.value))}
          className="mt-4 w-full max-w-md accent-cream"
        />
        <dl className="mt-7 max-w-md divide-y divide-cream/15 border-y border-cream/15">
          <div className="py-3 text-[0.98rem] text-cream/70">{t.people(e.people)}</div>
          {lines.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-3 text-[0.98rem]">
              <dt className="text-cream/70">{label}</dt>
              <dd className="shrink-0 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-col justify-end border-t border-cream/10 bg-[#3a0d14] px-7 py-10 sm:border-l sm:border-t-0 sm:px-12 sm:py-14">
        <div className="text-[0.9rem] text-cream/60">{t.totalLabel}</div>
        <div className="mt-2 font-serif text-[4.2rem] leading-none tracking-tight tabular-nums sm:text-[5.5rem]">{euro(e.totalCents)}</div>
        <div className="mt-3 max-w-xs text-[0.85rem] leading-snug text-cream/55">{t.note}</div>
      </div>
    </div>
  );
}
