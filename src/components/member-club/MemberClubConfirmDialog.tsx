"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

type MemberClubConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MemberClubConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: MemberClubConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-wine/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-confirm-title"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease }}
        className="relative w-full max-w-sm rounded-t-[1.75rem] bg-cream px-6 pb-6 pt-8 text-center shadow-[0_28px_60px_rgba(43,13,18,0.28)] sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="club-confirm-title"
          className="font-serif text-2xl font-medium tracking-tight text-wine"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-wine/65">{body}</p>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-5 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition hover:bg-[#3a1218] disabled:opacity-60"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-wine/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-wine/70 transition hover:border-wine/30 hover:text-wine disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
