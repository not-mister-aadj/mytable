import type { Locale } from "@/i18n/config";
import {
  sundayTableLpPath,
  wineTastingLpPath,
  wineWalkLpPath,
  chefsSpecialLpPath,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

type NavLabels = Dictionary["header"]["nav"];

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
