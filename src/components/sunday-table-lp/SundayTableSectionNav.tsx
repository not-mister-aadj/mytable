"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import type { Locale } from "@/i18n/config";
import { trackGroupInvitationShared } from "@/lib/posthog/analytics";

export type SectionNavItem = { id: string; label: string };

const FALLBACK_HEADER_HEIGHT = 72;

/** Bottom edge of the site header, which is fixed and changes height (phone
 * vs desktop, shrinking on scroll). Read fresh each time rather than from a
 * cached node, since the header can re-render, and never trusted when it
 * reads as 0 during hydration (the bar would slide under the header). */
function readSiteHeaderBottom(): number {
  const header = document.querySelector<HTMLElement>(".site-header");
  const bottom = header ? Math.round(header.getBoundingClientRect().bottom) : 0;
  return bottom > 20 ? bottom : FALLBACK_HEADER_HEIGHT;
}

function useSiteHeaderHeight(): number {
  const [height, setHeight] = useState(FALLBACK_HEADER_HEIGHT);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setHeight(readSiteHeaderBottom()));
    };
    update();
    // Once more after fonts and hydration have settled.
    const settle = window.setTimeout(update, 1000);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return height;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers or no clipboard permission: fall back to a hidden field.
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

const DESKTOP_QUERY = "(min-width: 1024px)";

/** Which ends of the sideways-scrolling tab row have tabs hidden past them,
 * so the row can fade out there as a hint that there is more to swipe to. */
function useOverflowEdges(ref: RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState({ start: false, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft < max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return edges;
}

/** Fever-style tab bar for a Sunday Social date page: jumps to each section,
 * underlines the one you are reading, and has a button that copies the
 * page link so it can be pasted anywhere. Sticks under the site header.
 * On phones it spans the full width flush under the header, without the
 * "Overzicht" tab or the share button (the photo has its own). */
export function SundayTableSectionNav({
  items,
  idleSectionId,
  shareUrl,
  shareLabel,
  copiedLabel,
  locale,
}: {
  /** The first item is the top of the page ("Overzicht"). */
  items: SectionNavItem[];
  /** A block between the sections that has no tab of its own (the booking
   * form on phones): while it is being read, no tab is underlined. */
  idleSectionId?: string;
  shareUrl: string;
  shareLabel: string;
  copiedLabel: string;
  locale: Locale;
}) {
  const headerHeight = useSiteHeaderHeight();
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const tabRefs = useRef(new Map<string, HTMLAnchorElement>());
  const edges = useOverflowEdges(listRef);
  // Room above a section once scrolled to: the site header plus this bar.
  const offset = headerHeight + 64;

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = offset + 8;
        let current = items[0]?.id ?? "";
        for (const item of items.slice(1)) {
          const el = document.getElementById(item.id);
          if (el && el.getBoundingClientRect().top <= line) current = item.id;
        }
        // On desktop the booking panel sits in its own column, so it never
        // stands between two sections there.
        const idle = idleSectionId ? document.getElementById(idleSectionId) : null;
        if (idle && !window.matchMedia(DESKTOP_QUERY).matches) {
          const box = idle.getBoundingClientRect();
          if (box.top <= line && box.bottom > line) current = "";
        }
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [items, offset, idleSectionId]);

  // On phones the tabs scroll sideways: keep the active one in the middle.
  useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current.get(active);
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  const fade = [
    edges.start ? "transparent 0" : "black 0",
    edges.start ? "black 2rem" : null,
    edges.end ? "black calc(100% - 2.5rem)" : null,
    edges.end ? "transparent 100%" : "black 100%",
  ]
    .filter(Boolean)
    .join(", ");
  const fadeMask = `linear-gradient(to right, ${fade})`;

  const goTo = useCallback(
    (id: string) => {
      const top =
        id === items[0]?.id
          ? 0
          : (document.getElementById(id)?.getBoundingClientRect().top ?? 0) +
            window.scrollY -
            offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    },
    [items, offset],
  );

  async function share() {
    const ok = await copyToClipboard(shareUrl);
    if (!ok) return;
    trackGroupInvitationShared({ channel: "copy_link", source: "sunday_table_section_nav", locale });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="pointer-events-none sticky top-[var(--nav-top)] z-40 -mt-2 mb-6 lg:top-[calc(var(--nav-top)+8px)] lg:mb-8"
      style={{ "--nav-top": `${headerHeight}px` } as CSSProperties}
    >
      {/* Same columns as the page below, so on desktop the bar only covers
          the left column and the booking panel on the right stays visible. */}
      <div className="mx-auto grid lg:max-w-6xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-x-12 lg:px-6">
        <nav
          data-section-nav
          aria-label={locale === "en" ? "Page sections" : "Onderdelen van de pagina"}
          className="pointer-events-auto flex min-w-0 items-center border-b border-wine/10 bg-cream/95 backdrop-blur-md lg:rounded-2xl lg:border lg:pl-2 lg:shadow-[0_10px_30px_rgba(43,13,18,0.08)]"
        >
          <ul
            ref={listRef}
            className="relative flex min-w-0 flex-1 overflow-x-auto px-2.5 [scrollbar-width:none] sm:px-3.5 lg:px-0 [&::-webkit-scrollbar]:hidden"
            style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
          >
            {items.map((item, index) => (
              <li key={item.id} className={index === 0 ? "hidden shrink-0 lg:block" : "shrink-0"}>
                <a
                  ref={(el) => {
                    if (el) tabRefs.current.set(item.id, el);
                  }}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(item.id);
                  }}
                  aria-current={active === item.id ? "true" : undefined}
                  className={`block border-b-2 px-2.5 py-3 text-sm transition ${
                    active === item.id
                      ? "border-burgundy font-medium text-burgundy"
                      : "border-transparent text-wine/65 hover:text-wine"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="relative hidden shrink-0 items-center border-l border-wine/10 px-1.5 lg:flex">
            <button
              type="button"
              onClick={share}
              aria-label={shareLabel}
              title={shareLabel}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-wine transition hover:bg-wine/5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3v12" />
                <path d="M7 8l5-5 5 5" />
                <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
            </button>
            {copied ? (
              <span
                role="status"
                className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-wine px-3 py-1.5 text-xs font-medium text-cream shadow-lg"
              >
                {copiedLabel}
              </span>
            ) : null}
          </div>
        </nav>
      </div>
    </div>
  );
}
