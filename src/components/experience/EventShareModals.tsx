"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { experiencePath } from "@/i18n/config";
import { eventShareEn } from "@/i18n/event-share-en";
import { eventShareNl } from "@/i18n/event-share-nl";
import type { EnrichedExperience } from "@/lib/experience-detail";

type Step = "invite" | "share" | null;

type EventShareModalsProps = {
  experience: EnrichedExperience;
  locale: Locale;
  enabled?: boolean;
};

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function sessionKey(slug: string): string {
  return `mytable-event-share:${slug}`;
}

export function EventShareModals({
  experience,
  locale,
  enabled = true,
}: EventShareModalsProps) {
  const dict = locale === "en" ? eventShareEn : eventShareNl;
  const [step, setStep] = useState<Step>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return experiencePath(locale, experience.slug);
    }
    const path = experiencePath(locale, experience.slug);
    return `${window.location.origin}${path}`;
  }, [experience.slug, locale]);

  const inviteMessage = useMemo(
    () =>
      fillTemplate(dict.inviteMessage, {
        event: experience.experienceName,
        city: experience.city,
        date: experience.dateTime,
        url: shareUrl,
      }),
    [
      dict.inviteMessage,
      experience.city,
      experience.dateTime,
      experience.experienceName,
      shareUrl,
    ],
  );

  const emailSubject = useMemo(
    () =>
      fillTemplate(dict.emailSubject, {
        event: experience.experienceName,
      }),
    [dict.emailSubject, experience.experienceName],
  );

  useEffect(() => {
    if (!enabled) return;
    try {
      if (sessionStorage.getItem(sessionKey(experience.slug)) === "1") return;
    } catch {
      // ignore
    }

    const timer = window.setTimeout(() => setStep("invite"), 700);
    return () => window.clearTimeout(timer);
  }, [enabled, experience.slug]);

  const markShown = useCallback(() => {
    try {
      sessionStorage.setItem(sessionKey(experience.slug), "1");
    } catch {
      // ignore
    }
  }, [experience.slug]);

  const closeAll = useCallback(() => {
    markShown();
    setStep(null);
  }, [markShown]);

  const goToShare = useCallback(() => {
    setCopied(false);
    setStep("share");
  }, []);

  const openWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    goToShare();
  }, [goToShare, inviteMessage]);

  const openEmail = useCallback(() => {
    const url = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(inviteMessage)}`;
    window.location.href = url;
    goToShare();
  }, [emailSubject, goToShare, inviteMessage]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const input = document.createElement("textarea");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: experience.experienceName,
        text: inviteMessage,
        url: shareUrl,
      });
      closeAll();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await copyLink();
    }
  }, [
    closeAll,
    copyLink,
    experience.experienceName,
    inviteMessage,
    shareUrl,
  ]);

  useEffect(() => {
    if (!step) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (step === "invite") goToShare();
        else closeAll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAll, goToShare, step]);

  return (
    <AnimatePresence>
      {step ? (
        <motion.div
          key={step}
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-wine/50 backdrop-blur-[2px]"
            aria-label={dict.invite.close}
            onClick={() => (step === "invite" ? goToShare() : closeAll())}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-share-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border-subtle bg-beige shadow-[0_28px_70px_rgba(43,13,18,0.22)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-b border-border-subtle bg-cream/80 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                {step === "invite" ? dict.invite.eyebrow : dict.share.eyebrow}
              </p>
              <h2
                id="event-share-title"
                className="mt-2 font-serif text-2xl font-medium text-wine"
              >
                {step === "invite" ? dict.invite.title : dict.share.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-wine/70">
                {step === "invite" ? dict.invite.body : dict.share.body}
              </p>
            </div>

            <div className="space-y-3 px-6 py-5">
              {step === "invite" ? (
                <>
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="flex w-full items-center justify-center rounded-full bg-burgundy px-5 py-3 text-sm font-medium text-cream transition-colors hover:bg-wine"
                  >
                    {dict.invite.whatsapp}
                  </button>
                  <button
                    type="button"
                    onClick={openEmail}
                    className="flex w-full items-center justify-center rounded-full border border-border-subtle bg-cream px-5 py-3 text-sm font-medium text-wine transition-colors hover:border-burgundy/25 hover:bg-beige"
                  >
                    {dict.invite.email}
                  </button>
                  <button
                    type="button"
                    onClick={goToShare}
                    className="w-full py-2 text-sm text-wine/55 transition-colors hover:text-wine"
                  >
                    {dict.invite.skip}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-cream px-3 py-2.5 text-sm text-wine"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="shrink-0 rounded-xl bg-burgundy px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-wine"
                    >
                      {copied ? dict.share.copied : dict.share.copy}
                    </button>
                  </div>
                  {typeof navigator !== "undefined" && "share" in navigator ? (
                    <button
                      type="button"
                      onClick={() => void nativeShare()}
                      className="flex w-full items-center justify-center rounded-full border border-border-subtle bg-cream px-5 py-3 text-sm font-medium text-wine transition-colors hover:border-burgundy/25 hover:bg-beige"
                    >
                      {dict.share.nativeShare}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeAll}
                    className="w-full py-2 text-sm text-wine/55 transition-colors hover:text-wine"
                  >
                    {dict.share.close}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
