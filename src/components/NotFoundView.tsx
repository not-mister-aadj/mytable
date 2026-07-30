"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  agendaPath,
  localePath,
  stripLocalePrefix,
  type Locale,
} from "@/i18n/config";

const ease = [0.22, 1, 0.36, 1] as const;

const HERO = "/girls-only/table-wine-laughing.jpg";

const copy = {
  nl: {
    code: "404",
    title: "Oeps. Verkeerde tafel.",
    body: "Hier zit niemand.",
    homeCta: "Terug naar MyTable",
    agendaCta: "Open de agenda",
  },
  en: {
    code: "404",
    title: "Oops. Wrong table.",
    body: "Nobody’s seated here.",
    homeCta: "Back to MyTable",
    agendaCta: "Open the agenda",
  },
} as const;

function resolveLocale(pathname: string | null): Locale {
  if (!pathname) return "nl";
  return stripLocalePrefix(pathname).locale;
}

export function NotFoundView() {
  const pathname = usePathname();
  const locale = resolveLocale(pathname);
  const labels = copy[locale];
  const homeHref = localePath(locale);
  const agendaHref = agendaPath(locale);

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-wine text-cream">
      <Image
        src={HERO}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-wine/50 via-wine/72 to-wine/94"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(197,154,91,0.22),transparent_52%)]"
        aria-hidden
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0.35, scale: 0.92 }}
        animate={{ opacity: 0.55, scale: 1 }}
        transition={{ duration: 2.4, ease }}
        className="pointer-events-none absolute left-1/2 top-[28%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <div className="flex max-w-2xl flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <Link
              href={homeHref}
              className="font-serif text-[3.25rem] font-medium leading-none tracking-tight text-cream transition hover:text-gold sm:text-6xl lg:text-[4.5rem]"
            >
              MyTable
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.35em" }}
            animate={{ opacity: 1, letterSpacing: "0.52em" }}
            transition={{ duration: 0.95, delay: 0.12, ease }}
            className="mt-8 text-[11px] font-semibold uppercase text-gold"
          >
            {labels.code}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mt-4 max-w-xl font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight text-balance text-cream/95 sm:text-4xl"
          >
            {labels.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.32, ease }}
            className="mt-5 max-w-md text-base leading-relaxed text-cream/62 sm:text-[1.05rem]"
          >
            {labels.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4"
          >
            <Link
              href={homeHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-cream px-8 text-xs font-semibold uppercase tracking-[0.16em] text-wine shadow-[0_14px_32px_rgba(0,0,0,0.28)] transition hover:bg-beige"
            >
              {labels.homeCta}
            </Link>
            <Link
              href={agendaHref}
              className="inline-flex min-h-12 items-center text-xs font-semibold uppercase tracking-[0.16em] text-cream/70 transition hover:text-cream"
            >
              {labels.agendaCta}
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
