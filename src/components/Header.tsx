"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { useSignIn } from "@/features/auth/SignInProvider";
import { FastLink } from "./ui/FastLink";
import {
  isMemberMobileHeaderHiddenPath,
  memberNavItems,
  publicNavItems,
} from "./MemberBottomNav";

interface HeaderProps {
  dict: Dictionary["header"];
  locale: Locale;
}

function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return pathname.slice(3) || "/";
  }
  return pathname || "/";
}

export function Header({ dict, locale }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const { isSignedIn, loading } = useAuthSession();
  const { startSignIn } = useSignIn();
  const home = localePath(locale);
  const pathname = usePathname() ?? "/";
  const path = stripLocale(pathname);
  const navItems = isSignedIn
    ? memberNavItems(locale, dict.nav)
    : publicNavItems(locale, dict.nav);
  const showPublicMobileMenu = !loading && !isSignedIn;
  const hideOnMobile =
    !loading && isSignedIn && isMemberMobileHeaderHiddenPath(path);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const accountCtaClass =
    "girls-only-header__cta inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cream disabled:opacity-60";

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-[60] border-b backdrop-blur-md transition-all duration-300 ${
        hideOnMobile ? "max-md:hidden" : ""
      } ${
        scrolled
          ? "site-header--scrolled shadow-[0_8px_30px_rgba(90,15,27,0.06)]"
          : "site-header--top"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-8 sm:py-3.5 md:grid-cols-[1fr_auto_1fr] lg:gap-4 lg:px-10">
        <div className="justify-self-start">
          {isSignedIn ? (
            <span className="relative inline-flex shrink-0" aria-label={dict.homeAria}>
              <Logo variant="header" priority />
            </span>
          ) : (
            <Link
              href={home}
              className="relative inline-flex shrink-0 transition-opacity hover:opacity-90"
              aria-label={dict.homeAria}
            >
              <Logo variant="header" priority />
            </Link>
          )}
        </div>

        {!loading ? (
          <nav
            className="hidden items-center justify-center gap-1 justify-self-center md:flex lg:gap-2"
            aria-label={dict.nav.navAria}
          >
            {navItems.map(({ href, label, match }) => {
              const active = match(path);
              return (
                <FastLink
                  key={href}
                  href={href}
                  className={`inline-flex items-center rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    active
                      ? "bg-wine/8 text-wine"
                      : "text-wine/55 hover:text-wine"
                  }`}
                >
                  <span aria-current={active ? "page" : undefined}>{label}</span>
                </FastLink>
              );
            })}
          </nav>
        ) : (
          <div className="hidden justify-self-center md:block" aria-hidden />
        )}

        <div className="flex items-center justify-end gap-1.5 justify-self-end sm:gap-3">
          {!isSignedIn ? (
            <LanguageSwitcher
              locale={locale}
              label={dict.languageSwitch}
              variant="girlsOnly"
            />
          ) : null}
          {loading ? (
            <div className="flex items-center gap-1 sm:gap-2" aria-hidden>
              <span className="inline-flex h-9 w-16 rounded-full bg-wine/5" />
              <span className="hidden h-9 w-24 rounded-full bg-wine/8 md:inline-flex" />
            </div>
          ) : isSignedIn ? null : (
            <>
              <div className="hidden items-center gap-1 sm:gap-2 md:flex">
                <button
                  type="button"
                  onClick={startSignIn}
                  className="inline-flex items-center px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-wine/75 transition hover:text-wine sm:px-3"
                >
                  {dict.nav.logIn}
                </button>
                <button
                  type="button"
                  onClick={startSignIn}
                  className={accountCtaClass}
                >
                  {dict.nav.signUp}
                </button>
              </div>
              <button
                type="button"
                className="site-header__menu-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border md:hidden"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? dict.closeMenu : dict.openMenu}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MenuIcon open={menuOpen} />
              </button>
            </>
          )}
        </div>
      </div>

      {menuOpen && showPublicMobileMenu ? (
        <div
          id={menuId}
          className="site-header__mobile-menu border-t border-wine/10 md:hidden"
        >
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-8"
            aria-label={dict.nav.navAria}
          >
            {navItems.map(({ href, label, match }) => {
              const active = match(path);
              return (
                <FastLink
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition ${
                    active
                      ? "bg-wine/8 text-wine"
                      : "text-wine/70 hover:bg-wine/5 hover:text-wine"
                  }`}
                >
                  <span aria-current={active ? "page" : undefined}>{label}</span>
                </FastLink>
              );
            })}
            <div className="mt-3 flex flex-col gap-2 border-t border-wine/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  startSignIn();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em] text-wine/80 transition hover:bg-wine/5 hover:text-wine"
              >
                {dict.nav.logIn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  startSignIn();
                }}
                className={`${accountCtaClass} min-h-11 justify-center`}
              >
                {dict.nav.signUp}
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-4" aria-hidden>
      <span
        className={`site-header__menu-icon absolute left-0 top-0 block h-0.5 w-full rounded-full transition ${
          open ? "translate-y-[6px] rotate-45" : ""
        }`}
      />
      <span
        className={`site-header__menu-icon absolute left-0 top-[6px] block h-0.5 w-full rounded-full transition ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`site-header__menu-icon absolute left-0 top-[12px] block h-0.5 w-full rounded-full transition ${
          open ? "-translate-y-[6px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}
