import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { waitlistPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

interface NewsletterCTAProps {
  dict: Dictionary["newsletter"];
  locale: Locale;
  sourceSection?: "agenda" | "event_detail";
  /** Stronger empty-agenda copy when no bookable tables */
  promoteWaitlist?: boolean;
}

export function NewsletterCTA({
  dict,
  locale,
  promoteWaitlist = false,
}: NewsletterCTAProps) {
  const promo = promoteWaitlist
    ? dict.emptyAgenda
    : {
        title: dict.title,
        subtitle: dict.subtitle,
        cta: dict.cta,
      };

  return (
    <div className="bg-cream">
      <section id="newsletter" className="scroll-mt-24 py-8 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-burgundy px-5 py-10 text-cream shadow-[0_24px_60px_rgba(90,15,27,0.2)] sm:rounded-3xl sm:px-12 sm:py-16">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <SectionHeading
                title={promo.title}
                subtitle={promo.subtitle}
                align="center"
                compact
                className="[&_h2]:text-cream [&_p]:text-cream/80"
              />
              <Button
                href={waitlistPath(locale)}
                variant="secondary"
                className="mt-8 bg-cream px-8 py-3.5 text-burgundy hover:bg-beige sm:mt-10"
              >
                <span aria-hidden className="mr-2 opacity-90">
                  ›
                </span>
                {promo.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
