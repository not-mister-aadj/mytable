"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import {
  accountPath,
  agendaPath,
  clubmemberPath,
  sundayTableLpPath,
  wineTastingLpPath,
  wineWalkLpPath,
  chefsSpecialLpPath,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { FastLink } from "@/components/ui/FastLink";

type NavLabels = Dictionary["header"]["nav"];

function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return pathname.slice(3) || "/";
  }
  return pathname || "/";
}

export function isClubmemberPath(path: string): boolean {
  return (
    path === "/clubmember" ||
    path.startsWith("/clubmember/") ||
    path === "/girls-only" ||
    path.startsWith("/girls-only/")
  );
}

export function isExperiencesPath(path: string): boolean {
  return path === "/agenda" || path.startsWith("/agenda/");
}

/** Signed-in mobile uses bottom nav — hide the fixed header on these surfaces. */
export function isMemberMobileHeaderHiddenPath(path: string): boolean {
  return isExperiencesPath(path) || isClubmemberPath(path);
}

function isAccountPath(path: string): boolean {
  return path === "/account" || path.startsWith("/account/");
}

export function memberNavItems(locale: Locale, nav: NavLabels) {
  return [
    {
      href: clubmemberPath(locale),
      label: nav.clubmember,
      match: isClubmemberPath,
    },
    {
      href: agendaPath(locale),
      label: nav.experiences,
      match: isExperiencesPath,
    },
    {
      href: accountPath(locale),
      label: nav.myAccount,
      match: isAccountPath,
    },
  ] as const;
}

export function publicNavItems(locale: Locale, _nav: NavLabels) {
  const isEn = locale === "en";
  return [
    {
      href: sundayTableLpPath(locale),
      label: "Sunday Table",
      match: (path: string) =>
        path === "/sunday-table" || path.startsWith("/sunday-table/"),
    },
    {
      href: wineTastingLpPath(locale),
      label: isEn ? "Wine Tasting" : "Wijnproeverij",
      match: (path: string) => path === "/wine-tasting",
    },
    {
      href: wineWalkLpPath(locale),
      label: isEn ? "Wine Walk" : "Wijnwalk",
      match: (path: string) => path === "/wine-walk",
    },
    {
      href: chefsSpecialLpPath(locale),
      label: "Chef's Table",
      match: (path: string) => path === "/chefs-special",
    },
  ] as const;
}

export function MemberBottomNav({
  locale,
  nav,
}: {
  locale: Locale;
  nav: NavLabels;
}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const path = stripLocale(pathname);
  const items = memberNavItems(locale, nav);

  useEffect(() => {
    router.prefetch(clubmemberPath(locale));
    router.prefetch(agendaPath(locale));
    router.prefetch(accountPath(locale));
  }, [locale, router]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-wine/10 bg-cream/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={nav.navAria}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, match }) => {
          const active = match(path);
          return (
            <li key={href} className="flex-1">
              <FastLink
                href={href}
                className={`relative z-10 flex min-h-[52px] flex-col items-center justify-center px-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  active ? "text-wine" : "text-wine/40 hover:text-wine/70"
                }`}
              >
                <span
                  aria-current={active ? "page" : undefined}
                  className={`max-w-[5.5rem] leading-tight ${
                    active ? "border-b border-wine pb-0.5" : ""
                  }`}
                >
                  {label}
                </span>
              </FastLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
