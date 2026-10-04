"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon } from "@/components/jouw-tafel/icons";

export const primaryButton =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-burgundy px-8 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition-[background-color,box-shadow,transform,color] duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:bg-[#cdbfbd] disabled:text-white disabled:shadow-none disabled:active:scale-100";

export const secondaryButton =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full border border-wine/15 bg-white px-8 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-wine shadow-[0_2px_10px_rgba(43,13,18,0.05)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60";

export const inputClass =
  "w-full rounded-2xl border bg-white px-5 py-4 text-[1.15rem] text-wine shadow-[0_2px_10px_rgba(43,13,18,0.04)] outline-none transition placeholder:text-wine/30 focus:ring-4";
export const inputOk = "border-wine/12 focus:border-burgundy/50 focus:ring-burgundy/10";
export const inputBad = "border-red-600 bg-red-50 ring-2 ring-red-600/20 focus:ring-red-600/20";

/** Question headline: centered, confident, sans. */
export const questionTitle =
  "mx-auto max-w-[22rem] text-center font-sans text-[1.6rem] font-semibold leading-[1.18] tracking-[-0.02em] text-wine text-balance outline-none";

/** One muted line under a question title. */
export const questionSub = "mx-auto mt-2.5 max-w-[20rem] text-center text-[0.95rem] leading-snug text-wine/55 text-balance";

/** Small caps label, e.g. above a field or a section. */
export const smallCaps = "text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy/80";

/** Space between the title block and the answers, like Timeleft. */
export const answersGap = "mt-8";

const tapSpring = { type: "spring" as const, stiffness: 520, damping: 32 };

/** Fade-up for the n-th answer (30ms apart). */
export function useStagger(index: number) {
  const reduce = useReducedMotion();
  if (reduce) return {};
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, delay: 0.06 + index * 0.03, ease: [0.22, 1, 0.36, 1] as const },
  };
}

/** The round radio or rounded checkbox at the right of an answer. */
export function SelectMark({ selected, multi }: { selected: boolean; multi: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-[1.4rem] w-[1.4rem] shrink-0 items-center justify-center border-[1.5px] transition-colors duration-200 ${
        multi ? "rounded-[0.45rem]" : "rounded-full"
      } ${selected ? "border-burgundy bg-burgundy text-cream" : "border-wine/20 bg-white text-transparent"}`}
    >
      {multi ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <span className={`h-2 w-2 rounded-full bg-cream transition-transform duration-200 ${selected ? "scale-100" : "scale-0"}`} />
      )}
    </span>
  );
}

/** Round tinted badge holding an answer's icon. */
export function IconBadge({ children, selected, size = "md" }: { children: ReactNode; selected: boolean; size?: "md" | "sm" }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full text-burgundy transition-colors duration-200 ${
        size === "sm" ? "h-9 w-9" : "h-10 w-10"
      } ${selected ? "bg-white shadow-[0_2px_8px_rgba(90,15,27,0.12)]" : "bg-[#f5ebe6]"}`}
    >
      {children}
    </span>
  );
}

const cardBase =
  "relative w-full touch-manipulation rounded-2xl border text-left transition-[border-color,background-color,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-40";
// The selected outline is 1px border + 1px inset ring: 2px, without moving
// anything.
const cardIdle = "border-wine/[0.08] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]";
const cardSelected = "border-burgundy bg-[#fcf4f2] shadow-[inset_0_0_0_1px_var(--burgundy),0_8px_22px_rgba(90,15,27,0.10)]";

/** One answer: icon left, text, radio (single) or checkbox (multi) right. */
export function ChoiceButton({
  selected,
  onClick,
  label,
  description,
  multi = false,
  disabled = false,
  icon,
  index = 0,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string | null;
  multi?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  /** Position in the list, for the staggered entrance. */
  index?: number;
}) {
  const stagger = useStagger(index);
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      {...stagger}
      whileTap={reduce || disabled ? undefined : { scale: 0.98, transition: tapSpring }}
      className={`${cardBase} flex min-h-[3.75rem] items-center gap-3.5 py-2.5 pl-3 pr-4 ${selected ? cardSelected : cardIdle} ${
        icon ? "" : "pl-5"
      }`}
    >
      {icon ? <IconBadge selected={selected}>{icon}</IconBadge> : null}
      <span className="min-w-0 flex-1 py-1">
        <span className="block text-[1rem] font-semibold leading-snug text-wine">{label}</span>
        {description ? <span className="mt-0.5 block text-[0.85rem] leading-snug text-wine/55">{description}</span> : null}
      </span>
      <SelectMark selected={selected} multi={multi} />
    </motion.button>
  );
}

/** Square tile for two-column grids: icon top-left, mark top-right. */
export function ChoiceTile({
  selected,
  onClick,
  label,
  icon,
  multi = true,
  index = 0,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  multi?: boolean;
  index?: number;
}) {
  const stagger = useStagger(index);
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      {...stagger}
      whileTap={reduce ? undefined : { scale: 0.98, transition: tapSpring }}
      className={`${cardBase} flex min-h-[5.6rem] flex-col justify-between gap-2 p-3.5 ${selected ? cardSelected : cardIdle}`}
    >
      <span className="flex w-full items-start justify-between">
        <IconBadge selected={selected} size="sm">
          {icon}
        </IconBadge>
        <SelectMark selected={selected} multi={multi} />
      </span>
      <span className="block text-[0.95rem] font-semibold leading-tight text-wine">{label}</span>
    </motion.button>
  );
}

/** Photo answer (Timeleft's tiles): a real photo, the label under it. */
export function PhotoChoice({
  selected,
  onClick,
  label,
  photo,
  index = 0,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  photo: string;
  index?: number;
}) {
  const stagger = useStagger(index);
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      {...stagger}
      whileTap={reduce ? undefined : { scale: 0.98, transition: tapSpring }}
      className={`${cardBase} flex flex-col p-2.5 pb-3.5 ${selected ? cardSelected : cardIdle}`}
    >
      <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-wine/10">
        <Image src={photo} alt="" fill sizes="(max-width: 480px) 45vw, 210px" quality={100} className="object-cover" />
        <span className="absolute right-2 top-2">
          <SelectMark selected={selected} multi={false} />
        </span>
      </span>
      <span className="mt-3 block px-1 text-[1rem] font-semibold leading-tight text-wine">{label}</span>
    </motion.button>
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
      <div className="bg-gradient-to-t from-cream from-60% to-cream/0 pt-8">
        <div className="mx-auto w-full max-w-md px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

/** Oval-masked real photo for the "did you know" stops. */
export function OvalPhoto({
  photo,
  priority = false,
  className = "aspect-[1.5/1] max-h-[34svh]",
}: {
  photo: string;
  priority?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative mx-auto w-full ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[50%] bg-wine/10 shadow-[0_22px_50px_rgba(43,13,18,0.20)]">
        <Image src={photo} alt="" fill sizes="(max-width: 480px) 100vw, 448px" quality={100} className="object-cover" priority={priority} />
      </div>
      <div aria-hidden className="pointer-events-none absolute -inset-2 rounded-[50%] border border-gold/35" />
    </motion.div>
  );
}

/** Loads a photo ahead of time with the same sizes as OvalPhoto. */
export function PhotoPreload({ photo }: { photo: string | null }) {
  if (!photo) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
      <div className="relative h-px w-px">
        <Image src={photo} alt="" fill sizes="(max-width: 480px) 100vw, 448px" quality={100} loading="eager" />
      </div>
    </div>
  );
}

export function FieldError({ message, attempt }: { message: string; attempt: number }) {
  return (
    <p
      key={attempt}
      role="alert"
      className="animate-field-error-bounce mt-2.5 text-center text-sm font-semibold text-red-600"
    >
      {message}
    </p>
  );
}
