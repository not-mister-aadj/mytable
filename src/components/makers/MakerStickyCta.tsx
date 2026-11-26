"use client";

import { useEffect, useState } from "react";

/**
 * "Plan een kennismaking" stays at the bottom once the hero is
 * out of view, and steps aside when the form itself is on screen.
 */
export function MakerStickyCta({ label }: { label: string }) {
  const [heroGone, setHeroGone] = useState(false);
  const [formShown, setFormShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("maker-hero");
    const form = document.getElementById("kennismaken");
    if (!hero || !form || typeof IntersectionObserver === "undefined") return;
    const heroObs = new IntersectionObserver(([entry]) => setHeroGone(!entry.isIntersecting), { threshold: 0 });
    const formObs = new IntersectionObserver(([entry]) => setFormShown(entry.isIntersecting), { threshold: 0 });
    heroObs.observe(hero);
    formObs.observe(form);
    return () => {
      heroObs.disconnect();
      formObs.disconnect();
    };
  }, []);

  const shown = heroGone && !formShown;
  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 transition duration-300 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <a
        href="#kennismaken"
        tabIndex={shown ? 0 : -1}
        className="mx-auto flex min-h-[3.25rem] max-w-sm items-center justify-center rounded-full bg-burgundy text-[0.98rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(60,10,20,0.6)]"
      >
        {label}
      </a>
    </div>
  );
}
