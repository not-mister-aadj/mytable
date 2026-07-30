import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clubmemberPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

interface NewsletterCTAProps {
  dict: Dictionary["newsletter"];
  locale: Locale;
  sourceSection?: "agenda" | "event_detail";
  /** Stronger empty-agenda copy when no bookable tables */
  promoteCommunity?: boolean;
}

export function NewsletterCTA({
  dict,
  locale,
  promoteCommunity = false,
}: NewsletterCTAProps) {
  const promo = promoteCommunity
    ? dict.emptyAgenda
    : {
        title: dict.title,
        subtitle: dict.subtitle,
        cta: dict.cta,
      };

  return (
    <div className="bg-cream">
      <section id="newsletter" className="scroll-mt-24 py-8 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-3xl xl:max-w-4xl">
          <div className="overflow-hidden rounded-[1.75rem] bg-burgundy px-5 py-10 text-cream shadow-[0_24px_60px_rgba(90,15,27,0.2)] sm:px-8 sm:py-12">
            <div className="mx-auto flex flex-col items-center text-center">
              <SectionHeading
                title={promo.title}
                subtitle={promo.subtitle}
                align="center"
                compact
                className="[&_h2]:text-cream [&_p]:text-cream/80"
              />
              <Button
                href={clubmemberPath(locale)}
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
