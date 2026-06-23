import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface HowItWorksProps {
  dict: Dictionary["howItWorks"];
}

function StepsList({ steps }: { steps: Dictionary["howItWorks"]["steps"] }) {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-6">
      {steps.map((item, index) => (
        <li key={item.title} className="relative text-center lg:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-beige font-serif text-xl font-medium text-burgundy sm:h-14 sm:w-14 sm:text-2xl lg:mx-0">
            {index + 1}
          </div>
          <h3 className="mt-4 font-serif text-lg font-medium text-wine sm:mt-5 sm:text-xl">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-wine/70">
            {item.description}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorks({ dict }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          title={dict.title}
          align="center"
          className="mx-auto"
          compact
        />

        <details className="group mt-6 sm:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-border-subtle bg-beige/80 px-4 py-3.5 text-left marker:content-none">
            <span className="text-sm font-medium text-wine">{dict.expandCta}</span>
            <span
              aria-hidden
              className="text-burgundy transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="mt-4">
            <StepsList steps={dict.steps} />
          </div>
        </details>

        <div className="mt-8 hidden sm:mt-14 sm:block">
          <StepsList steps={dict.steps} />
        </div>
      </div>
    </section>
  );
}
