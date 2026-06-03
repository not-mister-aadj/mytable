import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface TestimonialsProps {
  dict: Dictionary["testimonials"];
}

export function Testimonials({ dict }: TestimonialsProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading title={dict.title} align="center" className="mx-auto" />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dict.items.map((item) => (
            <blockquote
              key={item.name}
              className="flex flex-col rounded-2xl border border-border-subtle bg-beige p-6 shadow-sm sm:p-8"
            >
              <span className="font-serif text-4xl leading-none text-gold/60">
                &ldquo;
              </span>
              <p className="mt-2 flex-1 font-serif text-lg leading-relaxed text-wine sm:text-xl">
                {item.quote}
              </p>
              <footer className="mt-6 text-sm font-medium text-wine/60">
                {item.name}, {item.age}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
