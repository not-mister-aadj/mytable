import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import Link from "next/link";
import { ExperienceGrid } from "./ExperienceGrid";

interface ExperiencesSectionProps {
  dict: Dictionary["experiences"];
  pageLabels: Dictionary["experiencePage"];
  locale: Locale;
  agendaHref: string;
}

export function ExperiencesSection({
  dict,
  pageLabels,
  locale,
  agendaHref,
}: ExperiencesSectionProps) {
  return (
    <section id="experiences" className="scroll-mt-24 bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <ExperienceGrid
          title={dict.title}
          subtitle={dict.subtitle}
          status={dict.status}
          femaleOnlyBadge={dict.femaleOnlyBadge}
          reserveCta={dict.reserveCta}
          viewTableCta={pageLabels.viewTableCta}
          locale={locale}
          items={dict.items}
        />

        <div className="mt-12 flex justify-center sm:mt-14">
          <Link
            href={agendaHref}
            className="group inline-flex items-center gap-2 rounded-full border border-burgundy/25 bg-beige px-6 py-3 text-sm font-medium text-burgundy transition-all duration-300 hover:border-burgundy/40 hover:bg-cream hover:shadow-md"
          >
            <span>{dict.viewAllCta}</span>
            <span
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
