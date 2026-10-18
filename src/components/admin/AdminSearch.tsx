"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AdminSearchResult } from "@/app/api/admin/search/route";

/** The search box at the top of the sidebar; Ctrl+K (or Cmd+K) opens it. */
export function AdminSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await res.json()) as { results: AdminSearchResult[] };
        setResults(data.results ?? []);
        setActive(0);
      } catch {
        // Aborted or offline: keep the last results.
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const shown = query.trim().length >= 2 ? results : [];

  const go = (result: AdminSearchResult | undefined) => {
    if (!result) return;
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine/50 transition hover:border-burgundy/30 hover:text-wine/70"
      >
        <span>Zoeken…</span>
        <kbd className="rounded border border-border-subtle px-1.5 font-sans text-[11px]">Ctrl K</kbd>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Zoeken"
          className="fixed inset-0 z-[60] flex items-start justify-center bg-wine/30 px-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-beige shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              id="admin-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, shown.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  go(shown[active]);
                }
              }}
              placeholder="Naam, e-mail, MT-code of stad…"
              className="w-full border-b border-border-subtle bg-transparent px-5 py-4 text-base text-wine outline-none placeholder:text-wine/35"
            />
            <ul className="max-h-[50vh] overflow-y-auto py-2">
              {query.trim().length < 2 ? (
                <li className="px-5 py-3 text-sm text-wine/50">Typ minstens twee tekens.</li>
              ) : shown.length === 0 ? (
                <li className="px-5 py-3 text-sm text-wine/50">{loading ? "Zoeken…" : "Niets gevonden."}</li>
              ) : (
                shown.map((r, i) => (
                  <li key={`${r.href}-${i}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left ${i === active ? "bg-cream" : ""}`}
                    >
                      <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/40">{r.kind}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-wine">{r.title}</span>
                        <span className="block truncate text-xs text-wine/55">{r.subtitle}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
