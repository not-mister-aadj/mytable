"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  GIRLS_ONLY_FINAL_CTA_ID,
  GIRLS_ONLY_HERO_CTA_ID,
} from "@/components/girls-only/girls-only-ids";

const ctaClassName =
  "w-full bg-rose text-cream hover:bg-rose-deep px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm";

export { GIRLS_ONLY_HERO_CTA_ID };

interface GirlsOnlyStickyCtaProps {
  label: string;
  href: string;
  observeTargetId?: string;
  hideNearId?: string;
}

export function GirlsOnlyStickyCta({
  label,
  href,
  observeTargetId = GIRLS_ONLY_HERO_CTA_ID,
  hideNearId = GIRLS_ONLY_FINAL_CTA_ID,
}: GirlsOnlyStickyCtaProps) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(observeTargetId);
    const finalBanner = document.getElementById(hideNearId);

    const observers: IntersectionObserver[] = [];

    if (hero) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => setHeroVisible(entry.isIntersecting),
        { threshold: 0 },
      );
      heroObserver.observe(hero);
      observers.push(heroObserver);
    } else {
      setHeroVisible(false);
    }

    if (finalBanner) {
      const finalObserver = new IntersectionObserver(
        ([entry]) => setFinalVisible(entry.isIntersecting),
        { threshold: 0.15 },
      );
      finalObserver.observe(finalBanner);
      observers.push(finalObserver);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, [observeTargetId, hideNearId]);

  const showSticky = !heroVisible && !finalVisible;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-rose/20 bg-cream/95 p-3 shadow-[0_-10px_32px_rgba(43,13,18,0.1)] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden ${
        showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-hidden={!showSticky}
      inert={!showSticky ? true : undefined}
    >
      <Button href={href} className={ctaClassName} tabIndex={showSticky ? 0 : -1}>
        <span aria-hidden className="mr-2 opacity-90">
          ›
        </span>
        {label}
      </Button>
    </div>
  );
}
