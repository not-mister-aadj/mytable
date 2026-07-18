"use client";

import { Button } from "@/components/ui/Button";

const ctaClassName =
  "bg-rose text-cream hover:bg-rose-deep px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm";

export function GirlsOnlyCta({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Button href={href} className={`${ctaClassName} ${className}`} onClick={onClick}>
      <span aria-hidden className="mr-2 opacity-90">
        ›
      </span>
      {children}
    </Button>
  );
}
