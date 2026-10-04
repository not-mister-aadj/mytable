"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import {
  jouwTafelLogInPath,
  jouwTafelStartPath,
  localePath,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FastLink } from "./ui/FastLink";

interface HeaderProps {
  dict: Dictionary["header"];
  locale: Locale;
  /** Extra classes on the fixed header (e.g. top offset under a sale bar). */
  className?: string;
}

/** The site header: logo, "Inloggen" (or "Mijn tafel" once signed in to a
 * "Jouw tafel" account, back into the quiz where it was left, or the table
 * list once it is done) and the language switch. The button stays visible on
 * every screen size so returning members can always find their way back in. */
export function Header({ dict, locale, className = "" }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useAuthSession();
  const home = localePath(locale);
  const accountHref = isSignedIn
    ? jouwTafelStartPath(locale)
    : jouwTafelLogInPath(locale);
  const accountLabel = isSignedIn ? dict.nav.myTable : dict.nav.logIn;
  const accountActive = (usePathname() ?? "/") === accountHref;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-[60] border-b backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "site-header--scrolled shadow-[0_8px_30px_rgba(90,15,27,0.06)]"
          : "site-header--top"
      } ${className}`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-8 sm:py-3.5 lg:gap-4 lg:px-10">
        <div className="justify-self-start">
          <Link
            href={home}
            className="relative inline-flex shrink-0 transition-opacity hover:opacity-90"
            aria-label={dict.homeAria}
          >
            <Logo variant="header" priority />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 justify-self-end sm:gap-3">
          <FastLink
            href={accountHref}
            className={`cta-lift cta-lift-burgundy inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-burgundy px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-cream transition hover:bg-wine lg:px-4 lg:text-xs lg:tracking-[0.12em] ${
              accountActive ? "opacity-80" : ""
            }`}
          >
            <span aria-current={accountActive ? "page" : undefined}>
              {accountLabel}
            </span>
          </FastLink>
          <LanguageSwitcher
            locale={locale}
            label={dict.languageSwitch}
            variant="girlsOnly"
          />
        </div>
      </div>
    </header>
  );
}
