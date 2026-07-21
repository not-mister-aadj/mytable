"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { agendaPath } from "@/i18n/config";
import type { BlogUiLabels } from "@/i18n/blog-ui";

type BlogMobileStickyCtaProps = {
  labels: BlogUiLabels;
  locale: Locale;
  /** Hide sticky when this element is on screen (e.g. final CTA). */
  hideWhenId?: string;
};

export function BlogMobileStickyCta({
  labels,
  locale,
  hideWhenId = "blog-final-cta",
}: BlogMobileStickyCtaProps) {
  const [hidden, setHidden] = useState(false);
  const href = agendaPath(locale);

  useEffect(() => {
    const target = document.getElementById(hideWhenId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { root: null, rootMargin: "0px 0px -64px 0px", threshold: 0.15 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hideWhenId]);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[48] border-t border-rose/20 bg-cream/95 shadow-[0_-10px_32px_rgba(43,13,18,0.12)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label={labels.sidebarCtaButton}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base font-medium leading-tight text-wine">
            {labels.sidebarCtaTitle}
          </p>
          <p className="truncate text-xs text-wine/55">
            {labels.sidebarCtaFootnote}
          </p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-burgundy px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition hover:bg-wine"
        >
          {labels.sidebarCtaButton}
        </Link>
      </div>
    </div>
  );
}
