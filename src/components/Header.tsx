"use client";

import Link from "next/link";
import { FastLink } from "./ui/FastLink";
import { Logo } from "./Logo";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { agendaPath, localePath, waitlistPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  dict: Dictionary["header"];
  locale: Locale;
}

export function Header({ dict, locale }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = localePath(locale);
  const agenda = agendaPath(locale);
  const waitlist = waitlistPath(locale);

  const navLinks = [
    { label: dict.nav.girlsOnly, href: home },
    { label: dict.nav.calendar, href: agenda },
    { label: dict.nav.waitlist, href: waitlist },
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
        className={`site-header fixed inset-x-0 top-0 z-[60] border-b backdrop-blur-md transition-all duration-300 ${
          scrolled || menuOpen
            ? "site-header--scrolled shadow-[0_8px_30px_rgba(90,15,27,0.06)]"
            : "site-header--top"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-10">
          <Link
            href={home}
            className="relative shrink-0 transition-opacity hover:opacity-90"
            aria-label={dict.homeAria}
            onClick={closeMenu}
          >
            <Logo variant="header" priority />
          </Link>

          <nav
            className="hidden items-center gap-8 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <FastLink
                key={link.href}
                href={link.href}
                className="site-header__nav-link text-sm font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </FastLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher
              locale={locale}
              label={dict.languageSwitch}
              variant="girlsOnly"
            />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher
              locale={locale}
              label={dict.languageSwitch}
              variant="girlsOnly"
            />
            <button
              type="button"
              className="site-header__menu-btn flex h-10 w-10 items-center justify-center rounded-full border text-burgundy"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? dict.closeMenu : dict.openMenu}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </>
                ) : (
                  <>
                    <path d="M5 7h14" />
                    <path d="M5 12h14" />
                    <path d="M5 17h14" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-wine/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
        onClick={closeMenu}
      />

      <nav
        className={`site-header__mobile-menu fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-rose-soft via-cream to-cream transition-all duration-300 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
      >
        <div className="flex flex-1 flex-col justify-center px-8 pb-10 pt-24">
          <ul className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <FastLink
                  href={link.href}
                  className="site-header__nav-link block font-serif text-3xl font-medium transition-colors"
                  onClick={closeMenu}
                >
                  {link.label}
                </FastLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
