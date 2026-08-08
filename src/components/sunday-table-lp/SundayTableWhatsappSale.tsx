"use client";

import { useEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import {
  GIRLS_WHATSAPP_GROUP_URL,
  MIXED_WHATSAPP_GROUP_URL,
} from "@/lib/member-onboarding";
import {
  trackSundayTableCtaClicked,
  trackWhatsappJoinClicked,
} from "@/lib/posthog/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

function WhatsAppGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type SaleLabels = SundayTableLpLabels["sale"];

export function SundayTableWhatsappSale({
  labels,
  locale,
  open,
  onOpenChange,
}: {
  labels: SaleLabels;
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  function openSale() {
    trackSundayTableCtaClicked({
      cta: "try_out_sale_bar",
      source: "sunday_table_sale",
      locale,
    });
    onOpenChange(true);
  }

  function joinGroup(interest: "girls_only" | "mixed", href: string) {
    trackWhatsappJoinClicked({ interest, locale });
    trackSundayTableCtaClicked({
      cta:
        interest === "girls_only"
          ? "try_out_whatsapp_girls"
          : "try_out_whatsapp_mixed",
      source: "sunday_table_sale",
      locale,
    });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[70]">
        <button
          type="button"
          onClick={openSale}
          className="group relative flex w-full items-center justify-center overflow-hidden bg-wine px-4 py-2.5 text-center transition hover:bg-[#3a1018]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(197,154,91,0.18)_50%,transparent_60%)] bg-[length:220%_100%] opacity-80 transition-[background-position] duration-700 group-hover:bg-[position:100%_0]"
          />
          <span className="relative flex items-center justify-center gap-2.5">
            <span
              aria-hidden
              className="hidden h-1.5 w-1.5 rounded-full bg-gold sm:block"
            />
            <span className="max-w-[min(100%,22rem)] truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-cream sm:max-w-none sm:tracking-[0.16em]">
              <span className="sm:hidden">{labels.barMobile}</span>
              <span className="hidden sm:inline">{labels.bar}</span>
            </span>
            <span
              aria-hidden
              className="text-gold/90 transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="sale-overlay"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-wine/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-6"
            role="presentation"
            onClick={() => onOpenChange(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              aria-label={labels.dialogAria}
              initial={
                reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }
              }
              transition={{ duration: 0.35, ease }}
              className="relative w-full max-w-md overflow-hidden rounded-t-[1.75rem] bg-cream shadow-[0_32px_80px_rgba(43,13,18,0.28)] sm:rounded-[1.75rem]"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,154,91,0.22),transparent_65%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-wine/[0.04]"
              />

              <div className="relative px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                      {labels.eyebrow}
                    </p>
                    <h2
                      id={titleId}
                      className="mt-2.5 font-serif text-[1.65rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-[1.85rem]"
                    >
                      {labels.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wine/12 text-wine/45 transition hover:border-wine/25 hover:text-wine"
                    aria-label={labels.close}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p
                  id={descId}
                  className="mt-3 text-[0.95rem] leading-relaxed text-wine/55"
                >
                  {labels.body}
                </p>

                <div className="mt-6 space-y-3">
                  <a
                    href={GIRLS_WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      joinGroup("girls_only", GIRLS_WHATSAPP_GROUP_URL);
                    }}
                    className="group flex items-center gap-4 rounded-2xl border border-wine/10 bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(43,13,18,0.06)] transition hover:border-[#25D366]/35 hover:shadow-[0_14px_32px_rgba(37,211,102,0.12)]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_rgba(37,211,102,0.35)]">
                      <WhatsAppGlyph className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-semibold text-wine">
                        {labels.girlsOnly}
                      </span>
                      <span className="mt-0.5 block text-xs text-wine/45">
                        {labels.girlsOnlyHint}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="text-wine/30 transition group-hover:translate-x-0.5 group-hover:text-[#25D366]"
                    >
                      →
                    </span>
                  </a>

                  <a
                    href={MIXED_WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      joinGroup("mixed", MIXED_WHATSAPP_GROUP_URL);
                    }}
                    className="group flex items-center gap-4 rounded-2xl border border-wine/10 bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(43,13,18,0.06)] transition hover:border-[#25D366]/35 hover:shadow-[0_14px_32px_rgba(37,211,102,0.12)]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wine text-cream shadow-[0_8px_20px_rgba(43,13,18,0.22)]">
                      <WhatsAppGlyph className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-semibold text-wine">
                        {labels.mixed}
                      </span>
                      <span className="mt-0.5 block text-xs text-wine/45">
                        {labels.mixedHint}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="text-wine/30 transition group-hover:translate-x-0.5 group-hover:text-wine"
                    >
                      →
                    </span>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
