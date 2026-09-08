"use client";

/** Shared primary CTA button used across the landing pages (Sunday Table,
 * the format pages, and the homepage). Button-only — every real call site
 * opens the waitlist modal via onClick, none link out directly. */
export function PrimaryCta({
  label,
  hint,
  onClick,
  className = "",
}: {
  label: string;
  hint?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div className={`w-full min-w-0 sm:w-auto ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="cta-lift cta-lift-burgundy inline-flex min-h-[3.25rem] w-full max-w-full flex-col items-center justify-center rounded-full bg-burgundy px-9 py-3 text-center text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] hover:bg-wine sm:min-w-[15.5rem] sm:w-auto"
      >
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 text-[11px] font-medium normal-case tracking-normal text-cream/70">
            {hint}
          </span>
        ) : null}
      </button>
    </div>
  );
}
