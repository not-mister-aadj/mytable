"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { formatSpotsLeftHint } from "@/lib/event-display";
import { shouldShowSpotsCount } from "@/lib/experience-booking";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import {
  cityTables,
  cityTabs,
  displayCity,
  isNoLongerBookable,
  spotsLeft,
  type QuizCity,
  type QuizEvent,
} from "@/lib/jouw-tafel/logic";
import { ease } from "@/lib/motion";
import { PinIcon } from "@/components/jouw-tafel/icons";
import { openFromDay } from "@/lib/membership/early-label";
import { isMembersOnly } from "@/lib/membership/logic";

const AMSTERDAM = "Europe/Amsterdam";

/** "Zo 25 okt" / "Sun 25 Oct". */
function shortDate(iso: string, locale: Locale): string {
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .formatToParts(new Date(iso))
    .filter((p) => p.type === "weekday" || p.type === "day" || p.type === "month")
    .map((p) => p.value.replace(/\.$/, ""));
  const text = parts.join(" ");
  return text.charAt(0).toLocaleUpperCase(locale === "en" ? "en-GB" : "nl-NL") + text.slice(1);
}

/** "14:00" / "2:00 PM". */
function startTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: locale === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * "Eerstvolgende tafels": the live table list, per city. Information only:
 * date, age group, spots, "Binnenkort" or "Niet meer te boeken" (full or
 * closed, never said which). Never a venue.
 */
export function JouwTafelTables({
  locale,
  events,
  geoCity,
  now,
}: {
  locale: Locale;
  events: QuizEvent[];
  geoCity: QuizCity | null;
  now: number;
}) {
  const copy = getLandingCopy(locale).tables;
  const { cities, initial } = cityTabs(events, geoCity, now);
  const [city, setCity] = useState<QuizCity>(initial);
  const tables = cityTables(events, city, now);
  const shownCity = displayCity(city, locale);

  return (
    <div>
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{copy.eyebrow}</p>
        <h2 className="mt-3 font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance sm:text-[2.5rem]">
          {/* With a known city the heading names the city being shown, so
              it stays right after a tap on another city. */}
          {copy.title(geoCity ? shownCity : null)}
        </h2>
      </div>

      <div
        role="group"
        aria-label={copy.cityTabsAria}
        className="-mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((c) => {
          const selected = c === city;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={selected}
              onClick={() => setCity(c)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60 ${
                selected
                  ? "border-burgundy bg-burgundy text-cream"
                  : "border-wine/15 bg-white text-wine/75 hover:border-wine/35 hover:text-wine"
              }`}
            >
              {c === geoCity ? <PinIcon className="h-3.5 w-3.5" /> : null}
              {displayCity(c, locale)}
            </button>
          );
        })}
      </div>

      <motion.div
        key={city}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="mt-6 overflow-hidden rounded-[1.75rem] border border-wine/10 bg-white shadow-[0_18px_48px_rgba(43,13,18,0.08)]"
        aria-live="polite"
      >
        {tables.length === 0 ? (
          <p className="px-6 py-8 text-center text-[1rem] leading-relaxed text-wine/70">
            {copy.empty(shownCity)}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-wine/8">
              {tables.map((event) => {
                const left = spotsLeft(event);
                const showCount = shouldShowSpotsCount(left, event.spotsSold);
                const closed = isNoLongerBookable(event, now);
                return (
                  <li key={event.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`whitespace-nowrap font-serif text-[1.35rem] font-medium leading-tight ${closed ? "text-wine/50" : "text-wine"}`}
                      >
                        {shortDate(event.startsAt, locale)}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-wine/60">
                        <span>{startTime(event.startsAt, locale)}</span>
                        {event.bracket ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-semibold text-wine/80">{event.bracket}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {/* A visitor here is not a member yet: a table in the
                          members' days opens for them later too. */}
                      {closed ? (
                        <span className="text-sm font-medium text-wine/55">{copy.noLongerBookable}</span>
                      ) : event.comingSoon || isMembersOnly(event.membersOnlyUntil ?? null, now) ? (
                        <span className="block max-w-[10rem] text-[0.85rem] font-medium leading-snug text-wine/60">
                          {event.membersOnlyUntil ?? event.opensAt
                            ? copy.opensFrom(openFromDay((event.membersOnlyUntil ?? event.opensAt)!, locale))
                            : copy.comingSoon}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-burgundy">
                          {showCount ? formatSpotsLeftHint(left, locale) : copy.open}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="flex items-start gap-2 border-t border-wine/8 bg-cream/60 px-5 py-4 text-sm leading-relaxed text-wine/65 sm:px-6">
              <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {copy.where(shownCity)}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
