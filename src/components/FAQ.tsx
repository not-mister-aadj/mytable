import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface FAQProps {
  dict: Dictionary["faq"];
}

export function FAQ({ dict }: FAQProps) {
  return (
    <section id="faq" className="scroll-mt-24 bg-beige/50 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
        <SectionHeading title={dict.title} align="center" className="mx-auto" />

        <div className="mt-10 space-y-3">
          {dict.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-border-subtle bg-cream px-5 py-4 transition-shadow open:shadow-sm sm:px-6"
            >
              <summary className="cursor-pointer list-none font-medium text-wine marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="shrink-0 font-serif text-xl text-gold transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 pb-1 text-sm leading-relaxed text-wine/75">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
