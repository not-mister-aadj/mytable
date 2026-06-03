"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { agendaPath, localePath } from "@/i18n/config";
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border-subtle bg-cream/95 shadow-sm backdrop-blur-md"
          : "bg-cream/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link
          href={banner}
          scroll
          onClick={handleLogoClick}
          className="relative z-50 shrink-0 transition-opacity hover:opacity-90"
          aria-label={dict.homeAria}
        >
          <Logo variant="header" priority />
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-beige"
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

      <div
        className={`fixed inset-0 z-40 bg-wine/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        className={`fixed inset-x-0 top-[72px] z-40 border-b border-border-subtle bg-cream px-5 py-6 transition-all duration-300 lg:hidden ${
          menuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
        aria-label="Mobile navigation"
      >
        <ul className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block text-lg font-medium text-wine"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Button
              href={agenda}
              variant="primary"
              className="w-full"
              onClick={() => setMenuOpen(false)}
            >
              {dict.cta}
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
