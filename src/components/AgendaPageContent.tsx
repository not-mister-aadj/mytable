"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary, AgendaTabKey, ExperienceItem } from "@/i18n/types";
import { trackAgendaViewed, trackAgendaTabChange } from "@/lib/posthog/analytics";
import { filterAgendaItems, sortAgendaTimeline } from "@/lib/agenda";
import { enrichExperience } from "@/lib/experience-detail";
import { EmotionalTabs } from "./agenda/EmotionalTabs";
import { EmptyAgendaState } from "./agenda/EmptyAgendaState";
import { EventGrid } from "./agenda/EventGrid";

interface AgendaPageContentProps {
  dict: Dictionary["agenda"];
  pageLabels: Dictionary["experiencePage"];
  locale: import("@/i18n/config").Locale;
  items: ExperienceItem[];
}

export function AgendaPageContent({
  dict,
  pageLabels,
  locale,
  items: agendaItems,
}: AgendaPageContentProps) {
  const [activeTab, setActiveTab] = useState<AgendaTabKey>("all");

  const items = useMemo(
    () => sortAgendaTimeline(agendaItems.map(enrichExperience), locale),
    [agendaItems, locale],
  );

  const filteredItems = useMemo(
    () => filterAgendaItems(items, activeTab),
    [items, activeTab],
  );

  useEffect(() => {
    trackAgendaViewed({
      language: locale,
      category_filter: activeTab,
      number_of_events_visible: filteredItems.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on agenda mount
  }, []);

  function handleTabChange(next: AgendaTabKey) {
    const nextFiltered = filterAgendaItems(items, next);
    trackAgendaTabChange(dict.tabs, activeTab, next, nextFiltered.length, locale);
    setActiveTab(next);
  }

  const clearFilters = () => handleTabChange("all");

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="sticky top-[4.5rem] z-30 -mx-5 border-b border-border-subtle bg-cream/95 px-5 py-5 backdrop-blur-md sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <EmotionalTabs
          tabs={dict.tabs}
          active={activeTab}
          onChange={handleTabChange}
          ariaLabel={dict.tabsAriaLabel}
        />
        {dict.tabHints[activeTab] ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-wine/75 sm:text-[15px]">
            {dict.tabHints[activeTab]}
          </p>
        ) : null}
      </div>

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
          filterKey={activeTab}
        />
      ) : (
        <section className="mt-16 sm:mt-20">
          <EmptyAgendaState empty={dict.empty} onShowAll={clearFilters} />
        </section>
      )}
    </div>
  );
}
