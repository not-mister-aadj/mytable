import { clubmemberPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface AgendaCrossFeedProps {
  labels: NonNullable<Dictionary["agenda"]["crossFeed"]>;
  locale: Locale;
}

export function AgendaCrossFeed({ labels, locale }: AgendaCrossFeedProps) {
  const clubHref = clubmemberPath(locale);

  return (
    <div className="bg-cream">
      <section className="scroll-mt-24 py-6 sm:py-10 lg:py-14">
        <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-3xl xl:max-w-4xl">
          <div className="overflow-hidden rounded-[1.75rem] bg-burgundy px-5 py-7 text-cream shadow-[0_24px_60px_rgba(90,15,27,0.2)] sm:px-8 sm:py-8">
            <div className="mx-auto flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                {labels.eyebrow}
              </p>
              <SectionHeading
                title={labels.title}
                subtitle={labels.body}
                align="center"
                compact
                className="mt-2 [&_h2]:text-cream [&_p]:mt-2 [&_p]:text-cream/80 sm:[&_p]:mt-2.5"
              />
              {labels.benefits.length > 0 ? (
                <ul className="mt-5 w-full max-w-md space-y-0 border-t border-cream/15 text-left sm:mt-6">
                  {labels.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="border-b border-cream/15 py-2.5 text-sm leading-snug text-cream/90"
                    >
                      {benefit}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                href={clubHref}
                variant="secondary"
                className="mt-6 bg-cream px-8 py-3 text-burgundy hover:bg-beige"
              >
                <span aria-hidden className="mr-2 opacity-90">
                  ›
                </span>
                {labels.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
