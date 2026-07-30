import type { ExperienceExpectItem } from "@/i18n/types";

interface WhatToExpectProps {
  title: string;
  items: ExperienceExpectItem[];
}

export function WhatToExpect({ title, items }: WhatToExpectProps) {
  return (
    <section className="border-t border-wine/8 py-10 sm:py-14 lg:py-20">
      <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <ul className="mt-6 space-y-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 sm:space-y-0 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.title}
            className="border-t border-wine/10 py-5 sm:border-t-0 sm:py-0"
          >
            <h3 className="font-serif text-lg font-medium text-wine sm:text-xl">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-wine/60">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
