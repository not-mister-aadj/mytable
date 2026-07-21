"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { agendaPath } from "@/i18n/config";
import type { BlogUiLabels } from "@/i18n/blog-ui";

export type BlogTocItem = {
  id: string;
  label: string;
};

type BlogArticleSidebarProps = {
  labels: BlogUiLabels;
  locale: Locale;
  toc: BlogTocItem[];
  contentId: string;
};

export function BlogArticleSidebar({
  labels,
  locale,
  toc,
  contentId,
}: BlogArticleSidebarProps) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const content = document.getElementById(contentId);
    if (!content) return;

    const onScroll = () => {
      const rect = content.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = content.offsetHeight - viewport;
      const scrolled = Math.min(
        Math.max(-rect.top, 0),
        Math.max(total, 1),
      );
      const nextProgress =
        total <= 0 ? 100 : Math.round((scrolled / total) * 100);
      setProgress(Math.min(100, Math.max(0, nextProgress)));

      let current = toc[0]?.id ?? "";
      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) {
          current = item.id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [contentId, toc]);

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      {toc.length > 0 ? (
        <nav
          aria-label={labels.tocLabel}
          className="rounded-2xl border border-rose/20 bg-beige/70 p-4 shadow-[0_12px_40px_rgba(43,13,18,0.06)] sm:p-5"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left lg:pointer-events-none"
            onClick={() => setTocOpen((open) => !open)}
            aria-expanded={tocOpen}
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-wine/55">
              {labels.tocLabel}
            </p>
            <span className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-rose-deep">
                {progress}%
              </span>
              <span className="text-wine/45 lg:hidden" aria-hidden>
                {tocOpen ? "−" : "+"}
              </span>
            </span>
          </button>
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-rose/25"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-burgundy transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ol
            className={`mt-4 space-y-2.5 ${
              tocOpen ? "block" : "hidden"
            } lg:block`}
          >
            {toc.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setTocOpen(false)}
                    className={`block text-sm leading-snug transition-colors ${
                      isActive
                        ? "font-semibold text-burgundy"
                        : "text-wine/60 hover:text-burgundy"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="hidden rounded-2xl bg-gradient-to-b from-wine to-burgundy p-5 text-cream shadow-[0_16px_40px_rgba(43,13,18,0.18)] lg:block">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-rose">
          {labels.sidebarCtaEyebrow}
        </p>
        <p className="mt-3 font-serif text-2xl font-medium leading-tight tracking-tight text-cream">
          {labels.sidebarCtaTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-cream/75">
          {labels.sidebarCtaBody}
        </p>
        <Link
          href={agendaPath(locale)}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-burgundy transition hover:bg-rose-soft"
        >
          {labels.sidebarCtaButton}
          <span aria-hidden className="ml-2">
            →
          </span>
        </Link>
        <p className="mt-3 text-center text-[0.7rem] text-cream/55">
          {labels.sidebarCtaFootnote}
        </p>
      </div>
    </aside>
  );
}
