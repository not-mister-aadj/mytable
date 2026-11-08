"use client";

import Link from "next/link";
import { captureClientEvent } from "@/lib/posthog/client";
import { PostHogEvents } from "@/lib/posthog/events";

/** The "Apply" button on /ambassadors; counts clicks per spot on the page. */
export function AmbassadorCta({ href, label, location }: { href: string; label: string; location: "hero" | "closing" }) {
  const tone = location === "closing" ? "bg-cream text-wine hover:bg-white" : "bg-burgundy text-white hover:bg-burgundy/90";
  return (
    <Link
      href={href}
      onClick={() => captureClientEvent(PostHogEvents.ambassadorCtaClicked, { location })}
      className={`cta-lift inline-flex min-h-12 items-center rounded-full px-7 text-[0.98rem] font-semibold transition ${tone}`}
    >
      {label}
    </Link>
  );
}
