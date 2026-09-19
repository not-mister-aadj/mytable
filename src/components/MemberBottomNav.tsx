import type { Locale } from "@/i18n/config";
import {
  sundayTableLpPath,
  wineTastingLpPath,
  wineWalkLpPath,
  chefsSpecialLpPath,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

type NavLabels = Dictionary["header"]["nav"];

/** /sunday-table/[city]/[date] reveal pages — not part of the Sunday Table
 * product nav section, since guests reach them from the Agenda grid too. */
const SUNDAY_TABLE_EVENT_PATH = /^\/sunday-table\/[^/]+\/\d{4}-\d{2}-\d{2}$/;

/** Signed-out nav — the only nav the site has now that sign-in is paused
 * (see AuthProviders.tsx). Member nav/bottom-nav were removed along with
 * /account, /clubmember, /join, /boeking. */
export function publicNavItems(locale: Locale, _nav: NavLabels) {
  const isEn = locale === "en";
  return [
    {
      href: sundayTableLpPath(locale),
      label: "Sunday Table",
      match: (path: string) =>
        (path === "/sunday-table" || path.startsWith("/sunday-table/")) &&
        !SUNDAY_TABLE_EVENT_PATH.test(path),
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
