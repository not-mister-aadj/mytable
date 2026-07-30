import type { Locale } from "@/i18n/config";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
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
}: GuestQuotesProps) {
  const { culinary } = getBrandLandingTestimonialRows(locale);
  if (culinary.length === 0) return null;

  return (
    <section className="overflow-hidden border-t border-wine/8 py-10 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl">
            {title}
          </h2>
        </div>
      </div>
      <TestimonialMarquee
        top={culinary}
        bottom={[]}
        singleRow
        fadeFromClassName="from-cream"
        cardClassName="border-wine/10 bg-white/95"
      />
    </section>
  );
}
