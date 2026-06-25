"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const ctaClassName =
  "w-full bg-rose text-cream hover:bg-rose-deep px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm";

export const GIRLS_ONLY_HERO_CTA_ID = "girls-only-hero-cta";

interface GirlsOnlyStickyCtaProps {
  label: string;
  href: string;
  observeTargetId?: string;
}

export function GirlsOnlyStickyCta({
  label,
  href,
  observeTargetId = GIRLS_ONLY_HERO_CTA_ID,
}: GirlsOnlyStickyCtaProps) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const target = document.getElementById(observeTargetId);
    if (!target) {
      setShowSticky(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [observeTargetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-rose/20 bg-cream/95 p-3 shadow-[0_-10px_32px_rgba(43,13,18,0.1)] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden ${
        showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-hidden={!showSticky}
    >
      <Button href={href} className={ctaClassName} tabIndex={showSticky ? undefined : -1}>
        <span aria-hidden className="mr-2 opacity-90">
          ›
        </span>
        {label}
      </Button>
    </div>
  );
}
