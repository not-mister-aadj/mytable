"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { clubmemberPath } from "@/i18n/config";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { trackAgendaViewed } from "@/lib/posthog/analytics";
import {
  buildDateFilterOptions,
  filterAgendaByCity,
  filterAgendaByDate,
  sortAgendaTimeline,
} from "@/lib/agenda";
import { enrichExperience } from "@/lib/experience-detail";
import { interestsToMoods } from "@/lib/member-onboarding";
import { AgendaBrowseBar } from "./agenda/AgendaBrowseBar";
import { EmptyAgendaState } from "./agenda/EmptyAgendaState";
import { EventGrid } from "./agenda/EventGrid";

interface AgendaPageContentProps {
  dict: Dictionary["agenda"];
  pageLabels: Dictionary["experiencePage"];
  locale: import("@/i18n/config").Locale;
  items: ExperienceItem[];
}

function parseInterestParam(raw: string | null): WaitlistInterestId[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(
      (s): s is WaitlistInterestId =>
        s === "wine_walk" ||
        s === "food_walk" ||
        s === "wine_tasting" ||
        s === "chefs_special" ||
        s === "aperitivo",
    );
}

export function AgendaPageContent({
  dict,
  pageLabels,
  locale,
  items: agendaItems,
}: AgendaPageContentProps) {
  const searchParams = useSearchParams();
  const { isSignedIn, loading } = useAuthSession();
  const stickyTopClass = !loading && isSignedIn ? "top-0" : "top-[4.5rem]";
  const preferredMoods = useMemo(
    () => interestsToMoods(parseInterestParam(searchParams.get("interest"))),
    [searchParams],
  );
  const cityFromQuery = searchParams.get("city")?.trim() ?? "";
  const fromSundayTable = searchParams.get("from") === "sunday-table";
  const affiliateFromQuery = searchParams.get("aff")?.trim() ?? "";
  const [selectedCity, setSelectedCity] = useState(cityFromQuery);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (cityFromQuery) setSelectedCity(cityFromQuery);
  }, [cityFromQuery]);

  const items = useMemo(() => {
    const sorted = sortAgendaTimeline(
      agendaItems.map(enrichExperience),
      locale,
    );
    if (preferredMoods.length === 0) return sorted;
    return [...sorted].sort((a, b) => {
      const aMatch = preferredMoods.includes(a.mood) ? 0 : 1;
      const bMatch = preferredMoods.includes(b.mood) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [agendaItems, locale, preferredMoods]);

  const cities = useMemo(
    () => [...new Set(items.map((item) => item.city))].sort(),
    [items],
  );

  const dateOptions = useMemo(
    () => buildDateFilterOptions(items),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;
    result = filterAgendaByCity(result, selectedCity);
    result = filterAgendaByDate(result, selectedDate);
    return result;
  }, [items, selectedCity, selectedDate]);

  const hasActiveFilters = selectedCity !== "" || selectedDate !== "";

  useEffect(() => {
    trackAgendaViewed({
      language: locale,
      category_filter: "all",
      number_of_events_visible: filteredItems.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on agenda mount
  }, []);

  function clearAllFilters() {
    setSelectedCity(cityFromQuery);
    setSelectedDate("");
  }

  const filterKey = `${selectedCity}-${selectedDate}`;
  const experienceQuery =
    fromSundayTable || affiliateFromQuery
      ? [
          fromSundayTable ? "from=sunday-table" : null,
          affiliateFromQuery
            ? `aff=${encodeURIComponent(affiliateFromQuery)}`
            : null,
        ]
          .filter(Boolean)
          .join("&")
      : "";

  return (
    <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-5xl xl:max-w-6xl">
      {fromSundayTable && dict.sundayTableGroup ? (
        <div className="mb-6 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3.5 sm:px-5">
          <p className="font-serif text-lg font-medium text-wine">
            {dict.sundayTableGroup.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-wine/70">
            {dict.sundayTableGroup.body}
          </p>
        </div>
      ) : null}
      <section
        id="agenda-browse"
        className={`scroll-mt-24 sticky ${stickyTopClass} z-30 -mx-5 border-b border-wine/10 bg-cream/95 px-5 py-5 backdrop-blur-md sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none`}
      >
        <AgendaBrowseBar
          browse={dict.browse}
          cities={cities}
          dates={dateOptions}
          selectedCity={selectedCity}
          selectedDate={selectedDate}
          onCityChange={setSelectedCity}
          onDateChange={setSelectedDate}
          resultCount={filteredItems.length}
          onClear={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </section>

      {filteredItems.length > 0 ? (
        <EventGrid
          grid={dict.grid}
          items={filteredItems}
          statusLabels={dict.status}
          femaleOnlyBadge={dict.femaleOnlyBadge}
          reserveCta={dict.reserveCta}
          viewTableCta={pageLabels.viewTableCta}
          perPersonFromLabel={pageLabels.perPersonFrom}
          locale={locale}
          filterKey={filterKey}
          linkQuery={experienceQuery}
        />
      ) : (
        <section className="mt-10 sm:mt-12">
          <EmptyAgendaState
            empty={dict.empty}
            onShowAll={clearAllFilters}
            clearLabel={dict.browse.clear}
            communityHref={clubmemberPath(locale)}
            hasOtherTables={items.length > 0 && hasActiveFilters}
          />
        </section>
      )}
    </div>
  );
}
