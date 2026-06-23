"use client";

import { Button } from "./ui/Button";

interface HomeStickyCtaProps {
  label: string;
  href: string;
}

export function HomeStickyCta({ label, href }: HomeStickyCtaProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-cream/95 p-3 shadow-[0_-10px_32px_rgba(43,13,18,0.1)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label={label}
    >
      <Button href={href} variant="primary" className="w-full py-3.5 text-sm">
        {label}
      </Button>
    </div>
  );
}
