"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon } from "@/components/jouw-tafel/icons";
import { TableHeader, tableDate, tableTime } from "@/components/jouw-tafel/table/JouwTafelTable";
import { primaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import type { Locale } from "@/i18n/config";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { getStoredUtm } from "@/lib/analytics/utm";
import { formatEuros } from "@/lib/jouw-tafel/copy";
import { JOUW_TAFEL_CHECKOUT_SOURCE, JOUW_TAFEL_SEAT_PRICE_CENTS, displayCity, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { getQuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import { checkoutTableLanguage, defaultSeats, dietaryNotes, type QuizAnswers } from "@/lib/jouw-tafel/quiz-logic";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import { maxSeats, singleTotalCents } from "@/lib/jouw-tafel/table-logic";
import { trackTableEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

/** "€15" / "€9,50". */
export function euros(cents: number): string {
  return `€${formatEuros(cents)}`;
}

/** The table in one card: Sunday Table, date line, city. */
export function ReserveSummary({ locale, event }: { locale: Locale; event: QuizEvent }) {
  const t = getTableCopy(locale);
  return (
    <div className="rounded-2xl border border-wine/[0.08] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]">
      <p className="font-serif text-[1.25rem] font-medium leading-tight text-wine">{t.title}</p>
      <p className="mt-1 text-[0.92rem] text-wine/70">
        {t.dateLine(tableDate(event.startsAt, locale), tableTime(event.startsAt, locale), displayCity(event.city, locale))}
      </p>
    </div>
  );
}

/** 1 or 2 seats; one option when only one seat is left. */
export function SeatPicker({
  locale,
  event,
  seats,
  onChange,
}: {
  locale: Locale;
  event: QuizEvent;
  seats: 1 | 2;
  onChange: (seats: 1 | 2) => void;
}) {
  const t = getTableCopy(locale).reserve;
  const max = maxSeats(event);
  return (
    <section className="mt-7">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{t.seats}</h2>
      <div role="radiogroup" aria-label={t.seats} className="mt-3 grid grid-cols-2 gap-2.5">
        {([1, 2] as const).map((n) => {
          const selected = seats === n;
          const disabled = n > max;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`min-h-12 rounded-2xl border text-[0.98rem] font-semibold transition ${
                selected
                  ? "border-burgundy bg-[#fcf4f2] text-burgundy shadow-[inset_0_0_0_1px_var(--burgundy)]"
                  : "border-wine/[0.1] bg-white text-wine"
              } disabled:opacity-40`}
            >
              {t.seatOption(n)}
            </button>
          );
        })}
      </div>
      {max < 2 ? <p className="mt-2 text-[0.85rem] text-wine/60">{t.onlyOneLeft}</p> : null}
    </section>
  );
}

/** The three promises, with checks. */
export function Guarantees({ locale }: { locale: Locale }) {
  const lines = getQuizCopy(locale).kies.guarantees;
  return (
    <ul className="mt-6 space-y-2 text-[0.9rem] leading-snug text-wine/70">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          {line}
        </li>
      ))}
    </ul>
  );
}

/** Price lines: label left, amount right. */
export function PriceRow({ label, amount, strong = false }: { label: ReactNode; amount: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? "text-[1.05rem] font-semibold text-wine" : "text-[0.95rem] text-wine/75"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{amount}</span>
    </div>
  );
}

/** What the single-seat checkout needs to know about the guest. */
export type ReserveGuest = { email: string; answers: QuizAnswers };

/** Starts the single-seat checkout (funnel price, set by the server for
 * this source) and sends the browser to Stripe. Returns an error message. */
export async function startSingleCheckout({
  locale,
  event,
  seats,
  guest,
}: {
  locale: Locale;
  event: QuizEvent;
  seats: 1 | 2;
  guest: ReserveGuest;
}): Promise<string | null> {
  const t = getTableCopy(locale).reserve;
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        // The server charges the funnel's seat price for this source.
        source: JOUW_TAFEL_CHECKOUT_SOURCE,
        email: guest.email,
        name: guest.answers.name ?? "",
        seats,
        locale,
        // Everyone can book any table; the language preference goes along
        // and tables are matched by hand afterwards.
        tableLanguagePreference: checkoutTableLanguage(guest.answers.language),
        dietaryNotes: dietaryNotes(guest.answers) || undefined,
        utm: getStoredUtm(),
        meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
      }),
    });
    const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !data?.url) {
      Sentry.withScope((scope) => {
        scope.setTag("flow", "jouw_tafel_reserve_checkout");
        scope.setExtras({ status: res.status, error: data?.error });
        Sentry.captureMessage("Reserve checkout failed", "warning");
      });
      return data?.error ?? t.error;
    }
    window.location.assign(data.url);
    return null;
  } catch {
    return t.error;
  }
}

/** Page frame for the reserve step: back to the table, content, sticky pay bar. */
export function ReserveFrame({
  locale,
  tableHref,
  children,
  bar,
}: {
  locale: Locale;
  tableHref: string;
  children: ReactNode;
  bar: ReactNode;
}) {
  const t = getTableCopy(locale);
  return (
    <div className="min-h-[100svh] bg-cream pb-44 text-wine">
      <TableHeader href={tableHref} label={t.back} title={t.reserve.title} />
      <main className="mx-auto w-full max-w-md px-5 pt-2">{children}</main>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-wine/10 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{bar}</div>
      </div>
    </div>
  );
}

export function PayButton({ busy, label, busyLabel, onClick, error }: { busy: boolean; label: string; busyLabel: string; onClick: () => void; error: string | null }) {
  return (
    <>
      <button type="button" onClick={onClick} disabled={busy} className={primaryButton}>
        {busy ? busyLabel : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </>
  );
}

/**
 * Reserveren (single seat): summary, 1 or 2 seats at the funnel price, the
 * total, the promises and "Naar betalen" to Stripe.
 */
export function JouwTafelReserve({
  locale,
  event,
  guest,
  tableHref,
}: {
  locale: Locale;
  event: QuizEvent;
  guest: ReserveGuest;
  tableHref: string;
}) {
  const t = getTableCopy(locale).reserve;
  const [seats, setSeats] = useState<1 | 2>(() => (maxSeats(event) < 2 ? 1 : defaultSeats(guest.answers)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackTableEvent(PostHogEvents.reserveStepViewed, { event_slug: event.slug, locale, member: false });
  }, [event.slug, locale]);

  async function pay() {
    if (busy) return;
    trackTableEvent(PostHogEvents.reserveCheckoutClicked, { event_slug: event.slug, option: "single", seats, locale });
    setBusy(true);
    setError(null);
    const failed = await startSingleCheckout({ locale, event, seats, guest });
    if (failed) {
      setError(failed);
      setBusy(false);
    }
  }

  return (
    <ReserveFrame
      locale={locale}
      tableHref={tableHref}
      bar={<PayButton busy={busy} label={t.pay} busyLabel={t.paying} onClick={() => void pay()} error={error} />}
    >
      <ReserveSummary locale={locale} event={event} />
      <SeatPicker locale={locale} event={event} seats={seats} onChange={setSeats} />
      <section className="mt-7 space-y-2 border-t border-wine/10 pt-5">
        <PriceRow label={t.seatOption(seats)} amount={t.perSeat(euros(JOUW_TAFEL_SEAT_PRICE_CENTS))} />
        <PriceRow label={t.total} amount={euros(singleTotalCents(seats))} strong />
      </section>
      <Guarantees locale={locale} />
    </ReserveFrame>
  );
}
