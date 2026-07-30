"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AuthSignupForm } from "@/features/auth/AuthSignupForm";
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
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={labels.close}
        className="absolute inset-0 bg-wine/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-t-[1.5rem] border border-wine/10 bg-cream pb-[env(safe-area-inset-bottom,0px)] sm:rounded-[1.5rem]"
        initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, scale: 0.96 }}
        animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }}
        transition={
          isMobile
            ? { type: "spring", damping: 30, stiffness: 300 }
            : { duration: 0.2, ease: "easeOut" }
        }
      >
        <div className="relative h-[132px] overflow-hidden bg-gradient-to-br from-beige via-cream to-[#f0e6dc]">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/50"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-wine/8 text-wine/60 transition hover:bg-wine/12"
            aria-label={labels.close}
          >
            ×
          </button>
          <div className="absolute bottom-5 left-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {labels.eyebrow}
            </p>
            <h2
              id="login-modal-title"
              className="mt-1.5 font-serif text-2xl font-medium leading-snug text-wine"
            >
              {labels.title}
            </h2>
          </div>
        </div>

        <div className="px-5 py-5">
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
