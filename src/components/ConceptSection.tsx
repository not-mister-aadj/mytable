import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface ConceptSectionProps {
  dict: Dictionary["concept"];
}

export function ConceptSection({ dict }: ConceptSectionProps) {
  return (
    <section className="bg-beige/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading title={dict.title} subtitle={dict.subtitle} />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dict.cards.map((card, index) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border-subtle bg-cream p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
            >
              <span className="font-serif text-3xl font-medium text-gold/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-xl font-medium text-wine sm:text-2xl">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-wine/70 sm:text-base">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
