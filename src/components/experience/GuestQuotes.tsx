import type { Locale } from "@/i18n/config";
import {
  getGirlsOnlyTestimonials,
  splitGirlsOnlyTestimonialRows,
} from "@/data/girls-only-testimonials";
import {
  getTestimonials,
  splitTestimonialRows,
} from "@/data/testimonials";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";

interface GuestQuotesProps {
  eyebrow: string;
  title: string;
  locale: Locale;
  isFemaleOnly: boolean;
}

export function GuestQuotes({
  eyebrow,
  title,
  locale,
  isFemaleOnly,
}: GuestQuotesProps) {
  const { top, bottom } = isFemaleOnly
    ? splitGirlsOnlyTestimonialRows(getGirlsOnlyTestimonials(locale))
    : splitTestimonialRows(getTestimonials(locale));

  if (top.length === 0) return null;

  if (isFemaleOnly) {
    return (
      <section className="overflow-hidden border-y border-rose/15 bg-gradient-to-b from-rose-soft/50 to-cream py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-deep">
              {eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-xl font-medium tracking-tight text-wine sm:mt-3 sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>
        <div className="lg:hidden">
          <TestimonialMarquee
            top={top}
            bottom={bottom}
            fadeFromClassName="from-rose-soft/50"
            cardClassName="border-rose/15 bg-white/90"
            singleRow
          />
        </div>
        <div className="hidden lg:block">
          <TestimonialMarquee
            top={top}
            bottom={bottom}
            fadeFromClassName="from-rose-soft/50"
            cardClassName="border-rose/15 bg-white/90"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border-t border-border-subtle py-8 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:mt-3 sm:text-4xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="lg:hidden">
        <TestimonialMarquee top={top} bottom={bottom} singleRow />
      </div>
      <div className="hidden lg:block">
        <TestimonialMarquee top={top} bottom={bottom} />
      </div>
    </section>
  );
}
