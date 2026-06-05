import type { Dictionary } from "@/i18n/types";
import { Button } from "./ui/Button";
import { SectionHeading } from "./ui/SectionHeading";

interface VenueCTAProps {
  dict: Dictionary["venueCta"];
}

export function VenueCTA({ dict }: VenueCTAProps) {
  return (
    <section
      id="for-venues"
      className="scroll-mt-24 border-t border-border-subtle bg-beige/40 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading title={dict.title} subtitle={dict.subtitle} />
            <div className="mt-8">
              <Button href="mailto:info@mytable.club" variant="primary">
                {dict.cta}
              </Button>
            </div>
          </div>

          <ul className="grid gap-4">
            {dict.benefits.map((benefit) => (
              <li
                key={benefit.title}
                className="rounded-2xl border border-border-subtle bg-cream p-5 transition-shadow hover:shadow-md sm:p-6"
              >
                <h3 className="font-serif text-lg font-medium text-wine">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-wine/70">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
