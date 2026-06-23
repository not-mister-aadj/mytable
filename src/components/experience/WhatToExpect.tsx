import type { ExperienceExpectItem } from "@/i18n/types";

interface WhatToExpectProps {
  title: string;
  items: ExperienceExpectItem[];
}

export function WhatToExpect({ title, items }: WhatToExpectProps) {
  return (
    <section className="border-t border-border-subtle py-8 sm:py-14 lg:py-20">
      <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <ul className="mt-6 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-border-subtle bg-beige/80 p-4 transition-shadow duration-300 hover:shadow-md sm:p-6"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy/8 font-serif text-lg text-burgundy"
              aria-hidden
            >
              ◦
            </span>
            <h3 className="mt-4 font-medium text-wine">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-wine/65">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
