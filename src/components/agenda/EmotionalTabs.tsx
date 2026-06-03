"use client";

import type { AgendaTab, AgendaTabKey } from "@/i18n/types";

interface EmotionalTabsProps {
  tabs: AgendaTab[];
  active: AgendaTabKey;
  onChange: (tab: AgendaTabKey) => void;
  ariaLabel: string;
}

export function EmotionalTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
}: EmotionalTabsProps) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ${
              isActive
                ? "border-burgundy bg-burgundy text-cream shadow-[0_10px_28px_rgba(90,15,27,0.24)]"
                : "border-border-subtle bg-beige/90 text-wine/70 hover:border-gold/45 hover:bg-cream hover:text-burgundy"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
