import { experiencePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { ExperienceCard } from "../ExperienceCard";

interface RelatedExperiencesProps {
  title: string;
  items: EnrichedExperience[];
  locale: Locale;
  dict: Dictionary;
}

export function RelatedExperiences({
  title,
  items,
  locale,
  dict,
}: RelatedExperiencesProps) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {items.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            statusLabels={dict.agenda.status}
            femaleOnlyBadge={dict.agenda.femaleOnlyBadge}
            reserveCta={dict.agenda.reserveCta}
            viewTableCta={dict.experiencePage.viewTableCta}
            href={experiencePath(locale, experience.slug)}
          />
        ))}
      </div>
    </section>
  );
}
