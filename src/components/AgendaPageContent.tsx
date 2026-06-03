"use client";

import { useMemo, useState } from "react";
import type { Dictionary, AgendaTabKey } from "@/i18n/types";
import { filterAgendaItems } from "@/lib/agenda";
import { enrichExperience } from "@/lib/experience-detail";
import { EmotionalTabs } from "./agenda/EmotionalTabs";
import { EmptyAgendaState } from "./agenda/EmptyAgendaState";
import { EventGrid } from "./agenda/EventGrid";

interface AgendaPageContentProps {
  dict: Dictionary["agenda"];
  pageLabels: Dictionary["experiencePage"];
  locale: import("@/i18n/config").Locale;
}

export function AgendaPageContent({
  dict,
  pageLabels,
  locale,
}: AgendaPageContentProps) {
  const [activeTab, setActiveTab] = useState<AgendaTabKey>("all");

  const items = useMemo(
    () => dict.items.map(enrichExperience),
    [dict.items],
  );

  const filteredItems = useMemo(
    () => filterAgendaItems(items, activeTab),
    [items, activeTab],
  );

  const clearFilters = () => setActiveTab("all");

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="sticky top-[4.5rem] z-30 -mx-5 border-b border-border-subtle bg-cream/95 px-5 py-5 backdrop-blur-md sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <EmotionalTabs
          tabs={dict.tabs}
          active={activeTab}
          onChange={setActiveTab}
          ariaLabel={dict.tabsAriaLabel}
        />
      </div>

      {filteredItems.length > 0 ? (
        <EventGrid
          grid={dict.grid}
          items={filteredItems}
          statusLabels={dict.status}
          femaleOnlyBadge={dict.femaleOnlyBadge}
          reserveCta={dict.reserveCta}
          viewTableCta={pageLabels.viewTableCta}
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
