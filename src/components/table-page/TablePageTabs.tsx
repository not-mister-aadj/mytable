"use client";

import { useState, type ReactNode } from "react";

export type Tab = "table" | "game" | "picks";

/**
 * The table page on the day: Tafel, Spel and Aanraders as tabs, so not
 * everything shows at once. Before the start "Tafel" is open (where, when,
 * who); from the start "Spel".
 */
export function TablePageTabs({
  labels,
  initialTab,
  hasGame,
  table,
  game,
  picks,
}: {
  labels: { table: string; game: string; picks: string; aria: string };
  /** From the server: "game" once the afternoon has begun, else "table". */
  initialTab: Tab;
  hasGame: boolean;
  table: ReactNode;
  game: ReactNode;
  picks: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: [Tab, string][] = [["table", labels.table], ...(hasGame ? ([["game", labels.game]] as [Tab, string][]) : []), ["picks", labels.picks]];

  return (
    <>
      <div role="tablist" aria-label={labels.aria} className="sticky top-16 z-20 flex gap-1 rounded-full bg-[#ece3d8] p-1 shadow-sm">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              tab === key ? "bg-white text-burgundy shadow-sm" : "text-wine/60 hover:text-wine"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* All three stay rendered, so a half-played game or an open form keeps its state. */}
      <div role="tabpanel" hidden={tab !== "table"} className="space-y-5">
        {table}
      </div>
      {hasGame ? (
        <div role="tabpanel" hidden={tab !== "game"} className="space-y-5">
          {game}
        </div>
      ) : null}
      <div role="tabpanel" hidden={tab !== "picks"} className="space-y-5">
        {picks}
      </div>
    </>
  );
}
