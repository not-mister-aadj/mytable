"use client";

import {
  EXPERIENCE_TYPE_DEFINITIONS,
  type ExperienceTypeSlug,
} from "@/lib/experience-type-definitions";

export function EventTypePicker({
  onSelect,
}: {
  onSelect: (slug: ExperienceTypeSlug) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {EXPERIENCE_TYPE_DEFINITIONS.map((type) => (
        <button
          key={type.slug}
          type="button"
          onClick={() => onSelect(type.slug)}
          className="rounded-2xl border border-border-subtle bg-beige p-6 text-left transition hover:border-burgundy hover:shadow-md"
        >
          <h3 className="font-serif text-xl text-burgundy">{type.nameNl}</h3>
          <p className="mt-2 text-sm leading-relaxed text-wine/70">
            {type.descriptionNl}
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-burgundy">
            Kies dit format →
          </span>
        </button>
      ))}
    </div>
  );
}
