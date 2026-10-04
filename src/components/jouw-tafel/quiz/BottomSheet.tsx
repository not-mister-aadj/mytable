"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/jouw-tafel/icons";

/**
 * A bottom sheet in the style of the reserve panel on "Kies je zondag": a
 * modal dialog. Focus moves in and stays in (Tab wraps), Escape, the close
 * button or the backdrop closes it, and the page behind does not scroll.
 * Focus goes back to whatever had it before when the sheet closes.
 */
export function BottomSheet({
  labelledBy,
  closeLabel,
  onClose,
  title,
  children,
  tone = "white",
}: {
  /** Id of the element that names the dialog (a title inside it). */
  labelledBy: string;
  closeLabel: string;
  onClose: () => void;
  /** Optional heading next to the close button (gets `labelledBy` as id). */
  title?: ReactNode;
  children: ReactNode;
  /** "cream" for sheets with white answer cards inside. */
  tone?: "white" | "cream";
}) {
  const reduceMotion = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeButton.current?.focus({ preventScroll: true });
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [
        ...panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ];
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (!panel.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40">
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-wine/30"
        onClick={() => onCloseRef.current()}
      />
      <div className="absolute inset-x-0 bottom-0">
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          initial={reduceMotion ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={`relative mx-auto max-h-[88svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-b-0 border-wine/[0.08] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_rgba(43,13,18,0.12)] ${
            tone === "cream" ? "bg-cream" : "bg-white"
          }`}
        >
          <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-wine/15" />
          <div className={title ? "flex items-start justify-between gap-3" : "absolute right-4 top-6 z-10"}>
            {title ? (
              <h2 id={labelledBy} className="pt-1 font-serif text-[1.55rem] font-medium leading-tight text-wine">
                {title}
              </h2>
            ) : null}
            <button
              ref={closeButton}
              type="button"
              onClick={() => onCloseRef.current()}
              aria-label={closeLabel}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-wine transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
                tone === "cream" ? "bg-white" : "bg-cream"
              }`}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
