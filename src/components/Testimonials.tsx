import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import {
  getTestimonials,
  splitTestimonialRows,
} from "@/data/testimonials";
import { TestimonialMarquee } from "./TestimonialMarquee";

interface TestimonialsProps {
  dict: Dictionary["testimonials"];
  locale: Locale;
}

export function Testimonials({ dict, locale }: TestimonialsProps) {
  const { top, bottom } = splitTestimonialRows(getTestimonials(locale));

  return (
    <section className="overflow-hidden py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {dict.eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:mt-3 sm:text-4xl lg:text-5xl">
            {dict.title}
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
