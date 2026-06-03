import type { ExperienceExpectItem } from "@/i18n/types";

interface WhatToExpectProps {
  title: string;
  items: ExperienceExpectItem[];
}

export function WhatToExpect({ title, items }: WhatToExpectProps) {
  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-border-subtle bg-beige/80 p-6 transition-shadow duration-300 hover:shadow-md"
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
