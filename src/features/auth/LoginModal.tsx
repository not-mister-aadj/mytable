"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AuthSignupForm } from "@/features/auth/AuthSignupForm";
import { Logo } from "@/components/Logo";
import { type Locale } from "@/i18n/config";
import type { AccountAuthLabels } from "@/i18n/account.types";
import { postLoginPath } from "@/lib/member-onboarding";

interface LoginModalProps {
  open: boolean;
  locale: Locale;
  labels: AccountAuthLabels;
  onClose: () => void;
  onAuthenticated: () => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function LoginModal({
  open,
  locale,
  labels,
  onClose,
  onAuthenticated,
}: LoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setFormKey((k) => k + 1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleAuth = useCallback(() => {
    onAuthenticated();
  }, [onAuthenticated]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-5">
      <motion.button
        type="button"
        aria-label={labels.close}
        className="absolute inset-0 bg-[#1a0a0e]/55 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative w-full max-w-[400px] overflow-hidden rounded-t-[1.75rem] border border-wine/8 bg-gradient-to-b from-[#faf6f1] via-cream to-cream shadow-[0_24px_64px_rgba(43,13,18,0.22)] pb-[env(safe-area-inset-bottom,0px)] sm:rounded-[1.75rem]"
        initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
        transition={
          isMobile
            ? { type: "spring", damping: 32, stiffness: 320 }
            : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {isMobile ? (
          <div className="flex justify-center pt-3" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-wine/15" />
          </div>
        ) : null}

        <div className="relative px-6 pb-2 pt-5 sm:pt-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-wine/40 transition hover:bg-wine/6 hover:text-wine/70 sm:right-5 sm:top-5"
            aria-label={labels.close}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="pr-8">
            <Logo variant="header" />
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              {labels.eyebrow}
            </p>
            <h2
              id="login-modal-title"
              className="mt-2 font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight text-wine"
            >
              {labels.title}
            </h2>
            <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-wine/55">
              {labels.subtitle}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 sm:pb-7">
          <AuthSignupForm
            key={formKey}
            locale={locale}
            labels={labels}
            nextPath={postLoginPath(locale, null)}
            onAuthenticated={handleAuth}
          />
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
