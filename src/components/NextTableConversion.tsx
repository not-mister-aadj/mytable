"use client";

import { useState } from "react";
import { agendaPath, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import {
  trackGroupInvitationShared,
  trackSundayTableCtaClicked,
} from "@/lib/posthog/analytics";

export type NextTableConversionLabels = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  shareWhatsapp: string;
  copyLink: string;
  copied: string;
};

interface NextTableConversionProps {
  labels: NextTableConversionLabels;
  locale: Locale;
  /** Absolute or site-relative URL to share; defaults to agenda. */
  sharePath?: string;
  className?: string;
  source?: string;
}

export function NextTableConversion({
  labels,
  locale,
  sharePath,
  className = "",
  source = "home_next_table",
}: NextTableConversionProps) {
  const [copied, setCopied] = useState(false);
  const agendaHref = agendaPath(locale);
  const path = sharePath ?? agendaHref;

  function absoluteShareUrl(): string {
    if (path.startsWith("http")) return path;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function handleWhatsapp() {
    const url = absoluteShareUrl();
    const text = `${labels.title} ${url}`;
    trackGroupInvitationShared({ channel: "whatsapp", source, locale });
    trackSundayTableCtaClicked({ cta: "whatsapp_share", source, locale });
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleCopy() {
    const url = absoluteShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackGroupInvitationShared({ channel: "copy_link", source, locale });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <section
      className={`scroll-mt-20 border-t border-wine/10 bg-gradient-to-br from-beige via-cream to-beige ${className}`}
    >
      <div className="mx-auto max-w-3xl px-5 py-10 text-center sm:px-8 sm:py-14 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-wine/75">
          {labels.eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine text-balance sm:text-4xl">
          {labels.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-wine/70">
          {labels.body}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            href={agendaHref}
            onClick={() =>
              trackSundayTableCtaClicked({
                cta: "choose_next_experience",
                source,
                locale,
              })
            }
            className="w-full !bg-wine !text-cream hover:!bg-[#3a1218] sm:w-auto"
          >
            {labels.cta}
          </Button>
          <button
            type="button"
            onClick={handleWhatsapp}
            className="w-full rounded-full border border-wine/20 bg-white/80 px-6 py-3 text-sm font-medium text-wine transition hover:border-wine/40 sm:w-auto"
          >
            {labels.shareWhatsapp}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-full border border-wine/20 bg-white/80 px-6 py-3 text-sm font-medium text-wine transition hover:border-wine/40 sm:w-auto"
          >
            {copied ? labels.copied : labels.copyLink}
          </button>
        </div>
      </div>
    </section>
  );
}
