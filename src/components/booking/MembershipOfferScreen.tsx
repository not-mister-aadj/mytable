"use client";

import { MotionConfig, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { CalendarIcon, CheckIcon, ClockIcon, TwoGlassesIcon } from "@/components/jouw-tafel/icons";
import type { Locale } from "@/i18n/config";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { getMembershipOfferCopy, type MembershipOfferAmounts } from "@/lib/membership/offer-copy";
import { ease } from "@/lib/motion";
import { trackMembershipEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

type Props = {
  locale: Locale;
  /** The Checkout session of the booking that was just paid. */
  sessionId: string;
  /** "zondag 8 november": the Sunday that is now booked, if known. */
  sunday: string | null;
  amounts: MembershipOfferAmounts;
  /** "No thanks", or the offer turned out to be over: on to the confirmation. */
  onDone: () => void;
};

const ROW_ICONS = [CalendarIcon, ClockIcon, TwoGlassesIcon] as const;

/**
 * The screen between paying for a Sunday Social and its confirmation: the
 * membership, with the seat just paid for taken off the first month. "Yes"
 * goes straight to Stripe (no account step), "no thanks" to the
 * confirmation. It shows once per booking.
 */
export function MembershipOfferScreen({ locale, sessionId, sunday, amounts, onDone }: Props) {
  const copy = getMembershipOfferCopy(locale === "en" ? "en" : "nl", amounts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackMembershipEvent(PostHogEvents.membershipOfferShown, { language: locale, first_month: amounts.firstMonthCents / 100 });
  }, [locale, amounts.firstMonthCents]);

  async function accept() {
    if (busy) return;
    setBusy(true);
    setError(null);
    trackMembershipEvent(PostHogEvents.membershipOfferAccepted, { language: locale });
    try {
      const res = await fetch("/api/membership/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          locale,
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string; code?: string } | null;
      if (res.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }
      // Already a member, or the offer is over: the confirmation is next.
      if (data?.code === "already_member" || data?.code === "offer_closed") {
        onDone();
        return;
      }
      setError(data?.error ?? copy.error);
    } catch {
      setError(copy.error);
    }
    setBusy(false);
  }

  function decline() {
    if (busy) return;
    trackMembershipEvent(PostHogEvents.membershipOfferDeclined, { language: locale });
    void fetch("/api/membership/offer/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    }).catch(() => undefined);
    onDone();
  }

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease, delay },
  });

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-dvh overflow-hidden bg-wine text-cream">
        {/* Warm light behind the offer */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-burgundy/70 blur-3xl" />
          <div className="absolute right-[-180px] top-[38%] h-[420px] w-[420px] rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute bottom-[-220px] left-[-160px] h-[460px] w-[460px] rounded-full bg-burgundy/60 blur-3xl" />
        </div>

        {/* The booking is safe: said first, above everything else */}
        <div className="relative border-b border-wine/10 bg-cream text-wine">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
            <Logo priority />
            <p className="flex items-center gap-2 text-right text-[13px] font-medium leading-snug sm:text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-700 text-cream">
                <CheckIcon className="h-3 w-3" />
              </span>
              {copy.paid(sunday)}
            </p>
          </div>
        </div>

        <div className="relative mx-auto max-w-xl px-5 pb-14 pt-8 sm:px-6 sm:pt-14">
          <motion.p {...rise(0)} className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {copy.eyebrow}
          </motion.p>
          <motion.p {...rise(0.06)} className="mt-5 text-base leading-relaxed text-cream/75 sm:text-lg">
            {copy.lead}
          </motion.p>
          <motion.h1
            {...rise(0.1)}
            className="mt-1.5 font-serif text-[2.3rem] font-medium leading-[1.05] tracking-tight text-cream sm:text-6xl"
          >
            {copy.headline.before}
            <em className="text-gold">{copy.headline.accent}</em>
            {copy.headline.after}
          </motion.h1>

          {/* What a member gets, each with what it is worth */}
          <motion.section
            {...rise(0.2)}
            className="mt-7 overflow-hidden rounded-[28px] sm:mt-9 bg-cream text-wine shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-gold/30"
          >
            <div className="px-5 pt-6 sm:px-7 sm:pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{copy.stackTitle}</p>
              <ul className="mt-3 divide-y divide-wine/10">
                {copy.rows.map((row, index) => {
                  const Icon = ROW_ICONS[index];
                  return (
                    <li key={row.title} className="flex items-start gap-3.5 py-3.5 sm:py-4">
                      <span
                        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          row.credit ? "bg-gold text-wine" : "bg-burgundy/[0.08] text-burgundy"
                        }`}
                      >
                        {Icon ? <Icon className="h-[18px] w-[18px]" /> : <CheckIcon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[1.1rem] font-medium leading-snug text-wine sm:text-[1.3rem]">
                          {row.title}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-wine/60">{row.detail}</span>
                      </span>
                      {row.amount ? (
                        <span
                          className={`shrink-0 whitespace-nowrap pt-1 text-base font-semibold tabular-nums ${
                            row.credit ? "text-burgundy" : "text-wine/80"
                          }`}
                        >
                          {row.amount}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* The price: what it is worth, what it normally costs, what it costs now */}
            <div className="border-t border-wine/10 bg-beige px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-baseline justify-between gap-4 text-sm text-wine/65">
                <span>{copy.worth.label}</span>
                <span className="tabular-nums">{copy.worth.amount}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-4 text-sm text-wine/65">
                <span>{copy.regular.label}</span>
                <span className="tabular-nums line-through decoration-burgundy/60">{copy.regular.amount}</span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">
                    {copy.now.label}
                  </span>
                  <span className="mt-1 block text-sm text-wine/60">{copy.now.note}</span>
                </span>
                <span className="font-serif text-5xl font-medium leading-none tracking-tight text-burgundy sm:text-6xl">
                  {copy.now.amount}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.div {...rise(0.3)} className="mt-7">
            <button
              type="button"
              onClick={accept}
              disabled={busy}
              className="w-full rounded-full bg-gold px-6 py-[1.05rem] text-base font-semibold tracking-wide text-wine shadow-[0_14px_40px_rgba(197,154,91,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#d4ab6e] hover:shadow-[0_18px_48px_rgba(197,154,91,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:translate-y-0 disabled:opacity-70 sm:text-lg"
            >
              {busy ? copy.busy : copy.cta}
            </button>
            <p className="mt-3 text-center text-sm text-cream/65">{copy.terms}</p>
            {error ? (
              <p role="alert" className="mt-3 text-center text-sm font-medium text-[#f3b9b0]">
                {error}
              </p>
            ) : null}
          </motion.div>

          <motion.div {...rise(0.36)} className="mt-8 text-center">
            <button
              type="button"
              onClick={decline}
              disabled={busy}
              className="text-sm font-medium text-cream/75 underline decoration-cream/30 underline-offset-4 transition hover:text-cream hover:decoration-cream/70 disabled:opacity-50"
            >
              {copy.decline}
            </button>
            <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-cream/45">{copy.lastChance}</p>
          </motion.div>
        </div>
      </main>
    </MotionConfig>
  );
}
