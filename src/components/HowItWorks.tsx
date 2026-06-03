import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface HowItWorksProps {
  dict: Dictionary["howItWorks"];
}

export function HowItWorks({ dict }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          title={dict.title}
          align="center"
          className="mx-auto"
        />

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {dict.steps.map((item, index) => (
            <li key={item.title} className="relative text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-beige font-serif text-2xl font-medium text-burgundy lg:mx-0">
                {index + 1}
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium text-wine">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-wine/70">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
