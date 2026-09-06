"use client";

import { useId, useMemo, useState } from "react";

function nl(n: number, decimals: number): string {
  return n.toLocaleString("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function euro(n: number): string {
  if (!Number.isFinite(n)) return "n.v.t.";
  return n < 0 ? `-€${nl(Math.abs(n), 2)}` : `€${nl(n, 2)}`;
}

function useNumberField(initial: number) {
  const [raw, setRaw] = useState(String(initial));
  const value = parseFloat(raw) || 0;
  return { raw, value, setRaw };
}

function Field({
  id,
  label,
  raw,
  onChange,
  min = 0,
  step = 1,
  max,
}: {
  id: string;
  label: string;
  raw: string;
  onChange: (v: string) => void;
  min?: number;
  step?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-[0.06em] text-wine/50"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={raw}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-wine/15 bg-white px-3 py-2 font-mono text-[0.95rem] text-wine tabular-nums outline-none transition-colors focus:border-burgundy/50"
      />
    </div>
  );
}

function LedgerRow({
  label,
  caption,
  value,
  total = false,
  dark = false,
}: {
  label: string;
  caption?: string;
  value: string;
  total?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-[7px] ${
        total
          ? `mt-px border-t border-dashed pt-2.5 ${dark ? "border-[#4a2534]" : "border-wine/15"}`
          : `border-b ${dark ? "border-[#4a2534]" : "border-wine/10"} last:border-b-0`
      }`}
    >
      <div>
        <div
          className={
            total
              ? `text-[1.05rem] font-bold ${dark ? "text-[#f3ead9]" : "text-wine"}`
              : `text-[0.9rem] ${dark ? "text-[#f3ead9]" : "text-wine/85"}`
          }
        >
          {label}
        </div>
        {caption ? (
          <div
            className={`mt-0.5 text-[11.5px] ${dark ? "text-[#b39aa6]" : "text-wine/40"}`}
          >
            {caption}
          </div>
        ) : null}
      </div>
      <div
        className={`shrink-0 whitespace-nowrap font-mono tabular-nums ${
          total
            ? `text-[1.05rem] font-bold ${dark ? "text-[#f3ead9]" : "text-wine"}`
            : `text-[0.95rem] ${dark ? "text-[#f3ead9]" : "text-wine"}`
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function MixerCalculator() {
  const idPrefix = useId();

  const guests = useNumberField(16);
  const drinksPer = useNumberField(2.5);
  const normalPrice = useNumberField(8);
  const mixerPrice = useNumberField(6);

  const returnPct = useNumberField(30);
  const returnSpend = useNumberField(35);
  const partySize = useNumberField(2);
  const mixersPerYear = useNumberField(3);
  const regularRatio = useNumberField(10);
  const regularVisits = useNumberField(11);
  const margin = useNumberField(60);

  const r = useMemo(() => {
    const g = guests.value;
    const dpg = drinksPer.value;
    const np = normalPrice.value;
    const mp = mixerPrice.value;
    const rp = returnPct.value;
    const rs = returnSpend.value;
    const ps = partySize.value || 1;
    const rr = regularRatio.value;
    const rv = regularVisits.value;
    const m = margin.value;

    // Same two-tier shape WijnSpijs uses on their own calculator: most
    // returners come back once, a fraction of those become a true
    // regular who visits many times more in year one.
    const totalDrinks = dpg * g;
    const giveUpPerGlass = Math.max(0, np - mp);
    const invested = giveUpPerGlass * totalDrinks;
    const returning = g * (rp / 100);
    const regulars = rr > 0 ? returning / rr : 0;
    const onceRevenue = returning * rs * ps;
    const regularRevenue = regulars * rs * ps * rv;
    const returnRevenue = onceRevenue + regularRevenue;
    const revenuePerReturner = rs * ps * (1 + (rr > 0 ? rv / rr : 0));
    const profitOnReturn = returnRevenue * (m / 100);
    const net = profitOnReturn - invested;
    const roiPct = invested > 0 ? (profitOnReturn / invested) * 100 : 0;
    const breakevenDenom = revenuePerReturner * (m / 100);
    const breakevenCount = breakevenDenom > 0 ? invested / breakevenDenom : 0;
    const breakevenPct = g > 0 ? (breakevenCount / g) * 100 : 0;
    const costPerFace = g > 0 ? invested / g : 0;

    return {
      g,
      totalDrinks,
      giveUpPerGlass,
      invested,
      returning,
      regulars,
      onceRevenue,
      regularRevenue,
      profitOnReturn,
      net,
      roiPct,
      breakevenCount,
      breakevenPct,
      costPerFace,
    };
  }, [
    guests.value,
    drinksPer.value,
    normalPrice.value,
    mixerPrice.value,
    returnPct.value,
    returnSpend.value,
    partySize.value,
    regularRatio.value,
    regularVisits.value,
    margin.value,
  ]);

  const mpy = mixersPerYear.value;
  const yearInvested = r.invested * mpy;
  const yearProfit = r.net * mpy;

  const verdict =
    r.invested <= 0
      ? null
      : r.net >= 0
        ? {
            tone: "good" as const,
            text: `De moeite waard. Verdient zichzelf terug, plus ${euro(r.net)} extra, binnen een jaar.`,
          }
        : {
            tone: "warn" as const,
            text: `Nog niet. Heeft minstens ${nl(r.breakevenCount, 1)} gasten terug nodig (nu verwacht: ${nl(r.returning, 1)}) om quitte te spelen.`,
          };

  return (
    <div className="mt-8">
      <div className="rounded-lg border border-wine/12 bg-beige/60 p-5 sm:p-7">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-wine/45">
          Op het event zelf
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id={`${idPrefix}-guests`}
            label="Gasten bij deze Mixer"
            raw={guests.raw}
            onChange={guests.setRaw}
            min={1}
            step={1}
          />
          <Field
            id={`${idPrefix}-drinksPer`}
            label="Gemiddeld aantal drankjes per gast"
            raw={drinksPer.raw}
            onChange={drinksPer.setRaw}
            min={0}
            step={0.5}
          />
          <Field
            id={`${idPrefix}-normalPrice`}
            label="Jouw normale glasprijs (€)"
            raw={normalPrice.raw}
            onChange={normalPrice.setRaw}
            min={0}
            step={0.25}
          />
          <Field
            id={`${idPrefix}-mixerPrice`}
            label="Wat een Mixer-gast per glas betaalt (€)"
            raw={mixerPrice.raw}
            onChange={mixerPrice.setRaw}
            min={0}
            step={0.25}
          />
        </div>

        <div className="mt-6 border-t border-dashed border-wine/15 pt-5">
          <LedgerRow
            label="Drankjes dit event"
            caption="gasten × drankjes per gast"
            value={nl(r.totalDrinks, r.totalDrinks % 1 === 0 ? 0 : 1)}
          />
          <LedgerRow
            label="Wat je per glas weggeeft"
            caption="jouw normale glasprijs min de Mixer-prijs"
            value={euro(r.giveUpPerGlass)}
          />
          <LedgerRow
            label="Jouw investering dit event"
            caption="drankjes × wat je per glas weggeeft"
            value={euro(r.invested)}
            total
          />
        </div>

        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-wine/45">
          Het jaar erna
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            id={`${idPrefix}-returnPct`}
            label="Nieuwe gasten die binnen een jaar terugkomen (%)"
            raw={returnPct.raw}
            onChange={returnPct.setRaw}
            min={0}
            max={100}
            step={1}
          />
          <Field
            id={`${idPrefix}-returnSpend`}
            label="Normale besteding als ze terugkomen: eten én drank, volle prijs, per persoon (€)"
            raw={returnSpend.raw}
            onChange={returnSpend.setRaw}
            min={0}
            step={1}
          />
          <Field
            id={`${idPrefix}-partySize`}
            label="Gemiddeld aantal couverts per terugkeerbezoek"
            raw={partySize.raw}
            onChange={partySize.setRaw}
            min={1}
            step={0.5}
          />
          <Field
            id={`${idPrefix}-mixersPerYear`}
            label="Hoe vaak je dit per jaar organiseert"
            raw={mixersPerYear.raw}
            onChange={mixersPerYear.setRaw}
            min={1}
            step={1}
          />
          <Field
            id={`${idPrefix}-regularRatio`}
            label="Van de terugkomers wordt 1 op de zoveel vaste gast"
            raw={regularRatio.raw}
            onChange={regularRatio.setRaw}
            min={1}
            step={1}
          />
          <Field
            id={`${idPrefix}-regularVisits`}
            label="Extra bezoeken van een vaste gast, eerste jaar"
            raw={regularVisits.raw}
            onChange={regularVisits.setRaw}
            min={0}
            step={1}
          />
          <Field
            id={`${idPrefix}-margin`}
            label="Jouw winstmarge op die besteding (%)"
            raw={margin.raw}
            onChange={margin.setRaw}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#4a2534] bg-[#2a1520] p-5 sm:p-7">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#d9ad63]">
          Het rendement
        </div>
        <div className="mt-3">
          <LedgerRow
            dark
            label="Gasten die terugkomen"
            caption="gasten × terugkeerpercentage"
            value={nl(r.returning, 1)}
          />
          <LedgerRow
            dark
            label="Vaste gasten"
            caption="terugkomers ÷ 1 op de zoveel"
            value={nl(r.regulars, 1)}
          />
          <LedgerRow
            dark
            label="Omzet uit terugkeerbezoeken"
            caption="terugkomers × couverts × besteding per persoon"
            value={euro(r.onceRevenue)}
          />
          <LedgerRow
            dark
            label="Omzet uit vaste gasten"
            caption="vaste gasten × couverts × besteding × extra bezoeken"
            value={euro(r.regularRevenue)}
          />
          <LedgerRow
            dark
            label="Winst op die omzet"
            caption="totale omzet × jouw winstmarge"
            value={euro(r.profitOnReturn)}
          />
          <LedgerRow
            dark
            total
            label="Rendement op je investering"
            value={`${Math.round(r.roiPct)}%`}
          />
        </div>

        <div className="mt-5 border-t border-dashed border-[#4a2534] pt-5">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#d9ad63]">
            Op jaarbasis
          </div>
          <LedgerRow
            dark
            label="Wat je in totaal investeert"
            caption="investering per event × aantal Mixers per jaar"
            value={euro(yearInvested)}
          />
          <LedgerRow dark total label="Winst, per jaar" value={euro(yearProfit)} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-wine/12 bg-beige/60 p-5 sm:p-7">
        {verdict ? (
          <div
            className={`rounded px-4 py-3 font-mono text-[13.5px] ${
              verdict.tone === "good"
                ? "bg-[#e4efe6] text-[#2f6b3f]"
                : "bg-[#f7e9dd] text-[#96501c]"
            }`}
          >
            {verdict.text}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded border border-wine/12 bg-white px-3.5 py-2.5">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-wine/45">
              Kosten per nieuw gezicht, dit event
            </div>
            <div className="mt-0.5 font-mono text-[1.15rem] tabular-nums text-wine">
              {euro(r.costPerFace)}
            </div>
          </div>
          <div className="rounded border border-wine/12 bg-white px-3.5 py-2.5">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-wine/45">
              Moeten er minstens terugkomen
            </div>
            <div className="mt-0.5 font-mono text-[1.15rem] tabular-nums text-wine">
              {nl(r.breakevenCount, 1)} gasten
            </div>
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.05em] text-wine/45">
              {nl(r.breakevenPct, 1)}% van de groep
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12.5px] text-wine/40">
          Een inschatting op basis van je eigen invoer, geen garantie.
        </p>
      </div>
    </div>
  );
}
