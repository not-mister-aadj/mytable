import type { Locale } from "@/i18n/config";
import { sundayTableLocationPath } from "@/i18n/config";
import { FastLink } from "@/components/ui/FastLink";
import type { SundayTableLpCitySlug } from "@/data/sunday-table-lp-cities";
import {
  formatSundayTableCardDateTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

interface NextSundayTableCardProps {
  locale: Locale;
  tableDate: string;
  venueName: string;
  citySlug: SundayTableLpCitySlug;
  className?: string;
}

export function NextSundayTableCard({
  locale,
  tableDate,
  venueName,
  citySlug,
  className = "",
}: NextSundayTableCardProps) {
  return (
    <FastLink
      href={sundayTableLocationPath(locale, citySlug, tableDate)}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border border-wine/10 bg-cream px-6 py-5 text-center transition hover:border-wine/20 hover:shadow-sm sm:flex-row sm:justify-between sm:gap-4 sm:text-left ${className}`}
    >
      <span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-wine/50">
          {locale === "en" ? "Next Sunday Table" : "Eerstvolgende Sunday Table"}
        </span>
        <span className="mt-1 block font-serif text-lg text-wine">
          {formatSundayTableCardDateTime(
            parseAmsterdamDateIso(tableDate) ?? new Date(),
            locale,
          )}{" "}
          · {venueName}
        </span>
      </span>
      <span className="whitespace-nowrap text-sm font-medium text-burgundy">
        {locale === "en" ? "See the invite" : "Bekijk de uitnodiging"}{" "}
        <span aria-hidden>→</span>
      </span>
    </FastLink>
  );
}
