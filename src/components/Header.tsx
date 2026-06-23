"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { agendaPath, girlsOnlyPath, localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/Button";

interface HeaderProps {
  dict: Dictionary["header"];
  locale: Locale;
}

export function Header({ dict, locale }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = localePath(locale);
  const banner = localePath(locale, "#banner");
  const agenda = agendaPath(locale);
  const girlsOnly = girlsOnlyPath(locale);

  const scrollToBanner = () => {
    document.getElementById("banner")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", banner);
    setMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === home) {
      e.preventDefault();
      scrollToBanner();
    }
  };

  const navLinks = [
    { label: dict.nav.experiences, href: agenda },
    { label: dict.nav.girlsOnly, href: girlsOnly },
    { label: dict.nav.howItWorks, href: `${home}#how-it-works` },
    { label: dict.nav.forVenues, href: `${home}#for-venues` },
    { label: dict.nav.faq, href: `${home}#faq` },
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
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${
          scrolled || menuOpen
            ? "border-b border-border-subtle !bg-cream shadow-sm"
            : "!bg-cream"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-10">
          <Link
            href={banner}
            scroll
            onClick={handleLogoClick}
            className="relative shrink-0 transition-opacity hover:opacity-90"
            aria-label={dict.homeAria}
          >
            <Logo variant="header" priority />
          </Link>

          <nav
            className="hidden items-center gap-6 xl:gap-8 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className="text-sm font-medium text-wine/80 transition-colors hover:text-burgundy"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher locale={locale} label={dict.languageSwitch} />
            <Button href={agenda} variant="primary">
              {dict.cta}
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher locale={locale} label={dict.languageSwitch} />
            <button
              type="button"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-beige"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? dict.closeMenu : dict.openMenu}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span
                className={`h-0.5 w-5 bg-burgundy transition-all duration-300 ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-burgundy transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-burgundy transition-all duration-300 ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-wine/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />

      <nav
        className={`fixed inset-0 z-50 flex flex-col bg-cream transition-all duration-300 lg:hidden ${
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
                  prefetch
                  className="block font-serif text-2xl font-medium text-wine transition-colors hover:text-burgundy"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button
              href={agenda}
              variant="primary"
              className="w-full"
              onClick={closeMenu}
            >
              {dict.cta}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
