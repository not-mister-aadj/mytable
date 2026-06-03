"use client";

import { ATMOSPHERE_TAG_OPTIONS } from "@/lib/event-extras";

export function AtmosphereTags({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ATMOSPHERE_TAG_OPTIONS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              active
                ? "bg-burgundy text-cream"
                : "border border-border-subtle bg-cream text-wine/80 hover:border-burgundy/30"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
