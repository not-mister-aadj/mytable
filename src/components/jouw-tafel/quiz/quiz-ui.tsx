"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon } from "@/components/jouw-tafel/icons";

export const primaryButton =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-burgundy px-8 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none";

export const secondaryButton =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full border border-wine/20 bg-white px-8 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-wine transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60";

export const inputClass =
  "w-full rounded-2xl border bg-white px-4 py-4 text-[1.1rem] text-wine outline-none transition placeholder:text-wine/35 focus:ring-2";
export const inputOk = "border-wine/15 focus:border-burgundy/40 focus:ring-burgundy/15";
export const inputBad = "border-red-600 bg-red-50 ring-2 ring-red-600/20 focus:ring-red-600/30";

export const questionTitle =
  "font-serif text-[1.9rem] font-medium leading-[1.12] tracking-tight text-wine text-balance outline-none sm:text-[2.2rem]";

/** One answer. Single-choice shows a round mark, multi-select a square. */
export function ChoiceButton({
  selected,
  onClick,
  label,
  description,
  multi = false,
  disabled = false,
  compact = false,
  leading,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string | null;
  multi?: boolean;
  disabled?: boolean;
  /** Two-column grids: tighter padding, the fill alone shows the choice. */
  compact?: boolean;
  leading?: ReactNode;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-2xl border py-3.5 text-left ${compact ? "px-4" : "px-5"} transition duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 disabled:opacity-40 ${
        selected
          ? "border-burgundy bg-burgundy text-cream shadow-[0_10px_26px_rgba(90,15,27,0.22)]"
          : "border-wine/12 bg-white text-wine shadow-[0_2px_10px_rgba(43,13,18,0.04)]"
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-[1.05rem] font-medium leading-snug">{label}</span>
        {description ? (
          <span className={`mt-0.5 block text-sm leading-snug ${selected ? "text-cream/80" : "text-wine/60"}`}>
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={`${compact ? "hidden" : "flex"} h-6 w-6 shrink-0 items-center justify-center border transition ${
          multi ? "rounded-md" : "rounded-full"
        } ${selected ? "border-cream bg-cream text-burgundy" : "border-wine/25 bg-transparent text-transparent"}`}
      >
        <CheckIcon className="h-4 w-4" />
      </span>
    </button>
  );
}

/** Height of the keyboard on iOS (where it overlays the page), so the
 * bottom bar can sit right above it. 0 elsewhere. */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setInset(covered > 80 ? covered : 0);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}

/** Bottom bar for "Verder" and friends: above the keyboard and the home
 * indicator. */
export function StickyBar({ children }: { children: ReactNode }) {
  const inset = useKeyboardInset();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 transition-transform duration-150"
      style={{ transform: inset ? `translateY(-${inset}px)` : undefined }}
    >
      <div className="bg-gradient-to-t from-cream via-cream to-cream/0 pt-6">
        <div className="mx-auto w-full max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

/** Full-bleed photo with one or two lines over it. */
export function StopCard({
  photo,
  alt,
  children,
  priority = false,
}: {
  photo: string;
  alt: string;
  children: ReactNode;
  priority?: boolean;
}) {
  return (
    <div className="relative h-[calc(100svh-14.5rem)] min-h-[22rem] w-full overflow-hidden rounded-[1.75rem] bg-wine shadow-[0_24px_60px_rgba(43,13,18,0.18)]">
      <Image src={photo} alt={alt} fill sizes="(max-width: 480px) 100vw, 448px" className="object-cover" priority={priority} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2b0d12]/90 via-[#2b0d12]/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 pb-7">{children}</div>
    </div>
  );
}

/** Loads a photo ahead of time with the same sizes as StopCard. */
export function PhotoPreload({ photo }: { photo: string | null }) {
  if (!photo) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
      <div className="relative h-px w-px">
        <Image src={photo} alt="" fill sizes="(max-width: 480px) 100vw, 448px" loading="eager" />
      </div>
    </div>
  );
}

export function FieldError({ message, attempt }: { message: string; attempt: number }) {
  return (
    <p
      key={attempt}
      role="alert"
      className="animate-field-error-bounce mt-2.5 text-sm font-semibold text-red-600"
    >
      {message}
    </p>
  );
}
