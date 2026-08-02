"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { switchLocalePath, type Locale } from "@/i18n/config";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { saveMemberLocalePreference } from "@/features/auth/save-onboarding";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { trackLanguageChanged } from "@/lib/posthog/analytics";

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
  variant?: "default" | "girlsOnly";
}

const variants = {
  default:
    "rounded-full border border-border-subtle bg-beige px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-burgundy transition-colors hover:border-burgundy/30 hover:bg-cream",
  girlsOnly:
    "girls-only-header__lang rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
} as const;

export function LanguageSwitcher({
  locale,
  label,
  variant = "default",
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const nextLocale: Locale = locale === "nl" ? "en" : "nl";
  const [hash, setHash] = useState("");
  const { isSignedIn } = useAuthSession();

  useEffect(() => {
    setHash(window.location.hash);
  }, [pathname]);

  const href = switchLocalePath(pathname, locale, hash);

  function handleClick() {
    trackLanguageChanged({
      from_language: locale,
      to_language: nextLocale,
      page_path: pathname,
    });
    try {
      localStorage.setItem("mytable_locale_pref", nextLocale);
    } catch {
      /* ignore */
    }
    if (isSignedIn) {
      void saveMemberLocalePreference(nextLocale).then(() =>
        syncMemberCustomerClient(nextLocale, { forceLanguage: true }),
      );
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={variants[variant]}
      aria-label={locale === "nl" ? "Switch to English" : "Schakel naar Nederlands"}
    >
      {label}
    </Link>
  );
}
