"use client";

import { Button } from "@/components/ui/Button";

const ctaClassName =
  "w-full bg-rose text-cream hover:bg-rose-deep px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm";

interface GirlsOnlyStickyCtaProps {
  label: string;
}

export function GirlsOnlyStickyCta({ label }: GirlsOnlyStickyCtaProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rose/20 bg-cream/95 p-3 shadow-[0_-10px_32px_rgba(43,13,18,0.1)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Button href="#events" className={ctaClassName}>
        <span aria-hidden className="mr-2 opacity-90">
          ›
        </span>
        {label}
      </Button>
    </div>
  );
}
