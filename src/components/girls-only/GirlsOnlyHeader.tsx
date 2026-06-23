"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { girlsOnlyPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

interface GirlsOnlyHeaderProps {
  headerDict: Dictionary["header"];
  nav: GirlsOnlyPageLabels["headerNav"];
  ctaLabel: string;
  locale: Locale;
}

const navLinkClassName =
  "girls-only-header__nav-link text-sm font-medium transition-colors duration-200";

const ctaClassName =
  "girls-only-header__cta border-0 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 sm:text-sm";

export function GirlsOnlyHeader({
  headerDict,
  nav,
  ctaLabel,
  locale,
}: GirlsOnlyHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pageRoot = girlsOnlyPath(locale);

  const navLinks = [
    { label: nav.howItWorks, href: "#how-it-works" },
    { label: nav.whyJoin, href: "#why-join" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`girls-only-header fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${
          scrolled || menuOpen
            ? "girls-only-header--scrolled shadow-[0_8px_30px_rgba(90,15,27,0.06)]"
            : "girls-only-header--top"
        } border-b backdrop-blur-md`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-10">
          <Link
            href={pageRoot}
            className="girls-only-header__logo relative shrink-0 transition-opacity hover:opacity-90"
            aria-label={headerDict.homeAria}
            onClick={closeMenu}
          >
            <Logo variant="header" priority />
          </Link>

          <nav
            className="hidden items-center gap-6 lg:flex xl:gap-8"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClassName}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher
              locale={locale}
              label={headerDict.languageSwitch}
              variant="girlsOnly"
            />
            <Button href="#events" variant="primary" className={ctaClassName}>
              <span aria-hidden className="mr-1.5 opacity-90">
                ›
              </span>
              {ctaLabel}
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher
              locale={locale}
              label={headerDict.languageSwitch}
              variant="girlsOnly"
            />
            <button
              type="button"
              className="girls-only-header__menu-btn flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? headerDict.closeMenu : headerDict.openMenu}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span
                className={`girls-only-header__menu-icon h-0.5 w-5 transition-all duration-300 ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`girls-only-header__menu-icon h-0.5 w-5 transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`girls-only-header__menu-icon h-0.5 w-5 transition-all duration-300 ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Outside header so fixed positioning covers the viewport (backdrop-filter on header breaks inset-0 children). */}
      <div
        className={`fixed inset-0 z-50 bg-wine/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />

      <nav
        className={`girls-only-header__mobile-menu fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-rose-soft via-cream to-cream transition-all duration-300 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-1 flex-col justify-center px-8 pb-10 pt-24">
          <ul className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="girls-only-header__nav-link block font-serif text-2xl font-medium transition-colors"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button
              href="#events"
              variant="primary"
              className={`${ctaClassName} w-full`}
              onClick={closeMenu}
            >
              <span aria-hidden className="mr-1.5 opacity-90">
                ›
              </span>
              {ctaLabel}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
