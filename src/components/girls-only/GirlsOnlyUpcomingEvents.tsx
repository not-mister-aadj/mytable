"use client";

import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/Button";
import { experiencePath, type Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import type { EnrichedExperience } from "@/lib/experience-detail";

interface GirlsOnlyUpcomingEventsProps {
  events: EnrichedExperience[];
  locale: Locale;
  labels: GirlsOnlyPageLabels;
  agendaHref: string;
}

const cardProps = (
  labels: GirlsOnlyPageLabels,
  locale: Locale,
) => ({
  statusLabels: labels.status,
  femaleOnlyBadge: labels.femaleOnlyBadge,
  reserveCta: labels.reserveCta,
  viewTableCta: labels.viewTableCta,
  perPersonFromLabel: labels.perPersonFrom,
  locale,
  socialPromise: labels.socialPromise,
  sourceSection: "agenda_grid" as const,
  compact: true,
});

export function GirlsOnlyUpcomingEvents({
  events,
  locale,
  labels,
  agendaHref,
}: GirlsOnlyUpcomingEventsProps) {
  if (events.length === 0) return null;

  const sharedCardProps = cardProps(labels, locale);

  return (
    <div id="events" className="mx-auto mt-8 max-w-7xl scroll-mt-20 sm:mt-10">
      <div className="lg:hidden">
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scrollbar-none sm:-mx-8 sm:px-8">
          {events.map((experience) => (
            <div
              key={experience.id}
              className="w-[min(85vw,18rem)] shrink-0 snap-start"
            >
              <ExperienceCard
                experience={experience}
                href={experiencePath(locale, experience.slug)}
                {...sharedCardProps}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        {events.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            href={experiencePath(locale, experience.slug)}
            {...sharedCardProps}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center sm:mt-8">
        <Button
          href={agendaHref}
          className="bg-rose px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-rose-deep sm:text-sm"
        >
          <span aria-hidden className="mr-2 opacity-90">
            ›
          </span>
          {labels.events.viewAll}
        </Button>
      </div>
    </div>
  );
}
