import { experiencePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { enrichExperience } from "@/lib/experience-detail";
import { ExperienceCard } from "./ExperienceCard";
import { SectionHeading } from "./ui/SectionHeading";

interface ExperienceGridProps {
  title: string;
  subtitle: string;
  status: Dictionary["experiences"]["status"];
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  locale: Locale;
  items: Dictionary["experiences"]["items"];
  className?: string;
}

export function ExperienceGrid({
  title,
  subtitle,
  status,
  femaleOnlyBadge,
  reserveCta,
  viewTableCta,
  locale,
  items,
  className = "",
}: ExperienceGridProps) {
  return (
    <div className={className}>
      <SectionHeading title={title} subtitle={subtitle} />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-7">
        {items.map((item) => {
          const experience = enrichExperience(item);
          return (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              statusLabels={status}
              femaleOnlyBadge={femaleOnlyBadge}
              reserveCta={reserveCta}
              viewTableCta={viewTableCta}
              href={experiencePath(locale, experience.slug)}
              locale={locale}
              sourceSection="home_grid"
            />
          );
        })}
      </div>
    </div>
  );
}
