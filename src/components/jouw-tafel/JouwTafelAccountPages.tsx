import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { JouwTafelAuthForm, type AuthScreen } from "@/components/jouw-tafel/JouwTafelAuthForm";
import { NO_INDEX } from "@/components/jouw-tafel/JouwTafelPage";
import { PlaceholderViewTracker } from "@/components/jouw-tafel/PlaceholderViewTracker";
import { ArrowLeftIcon } from "@/components/jouw-tafel/icons";
import {
  jouwTafelLogInPath,
  jouwTafelPath,
  jouwTafelSignUpPath,
  jouwTafelWelcomePath,
  privacyPath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import { isGoogleSignInAllowed, isInAppBrowser, isNewAuthUser } from "@/lib/jouw-tafel/auth-logic";

export type AccountSearchParams = Record<string, string | string[] | undefined>;

export function jouwTafelAuthMetadata(locale: Locale, screen: AuthScreen): Metadata {
  const copy = getLandingCopy(locale).auth;
  return {
    title: screen === "signup" ? copy.signUp.metaTitle : copy.logIn.metaTitle,
    robots: NO_INDEX,
  };
}

export function jouwTafelWelcomeMetadata(locale: Locale): Metadata {
  return { title: getLandingCopy(locale).auth.welcome.metaTitle, robots: NO_INDEX };
}

/** Header with logo (back to the landing page) and the NL/EN switch. */
function AccountShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-cream text-wine">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Link href={jouwTafelPath(locale)} aria-label="MyTable">
          <Logo priority />
        </Link>
        <LanguageSwitcher locale={locale} label={locale === "nl" ? "EN" : "NL"} />
      </header>
      <main className="relative flex flex-1 justify-center overflow-hidden px-4 pb-16 pt-4 sm:items-center sm:px-5 sm:pb-24 sm:pt-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(197,154,91,0.16),transparent_60%)]" />
        <div className="relative h-fit w-full max-w-md rounded-[1.75rem] border border-wine/8 bg-white/70 px-6 py-8 shadow-[0_24px_60px_rgba(43,13,18,0.1)] sm:px-8 sm:py-10">
          <span aria-hidden className="block h-px w-12 bg-gold" />
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/** /jouw-tafel/aanmelden and /jouw-tafel/inloggen (EN /en/your-table/...). */
export async function JouwTafelAuthPage({
  locale,
  screen,
  searchParams,
}: {
  locale: Locale;
  screen: AuthScreen;
  searchParams: AccountSearchParams;
}) {
  // Already signed in: nothing to do here.
  if (await getMemberUser()) redirect(jouwTafelWelcomePath(locale));

  const userAgent = (await headers()).get("user-agent");
  const inApp = isInAppBrowser(userAgent);
  const googleAllowed = isGoogleSignInAllowed({
    flag: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
    userAgent,
  });
  return (
    <AccountShell locale={locale}>
      <PlaceholderViewTracker kind={screen} locale={locale} />
      <JouwTafelAuthForm
        locale={locale}
        screen={screen}
        googleAllowed={googleAllowed}
        inApp={inApp}
        googleError={firstParam(searchParams.fout) === "google"}
        welcomePath={jouwTafelWelcomePath(locale)}
        switchPath={screen === "signup" ? jouwTafelLogInPath(locale) : jouwTafelSignUpPath(locale)}
        signUpPath={jouwTafelSignUpPath(locale)}
        termsHref={termsPath(locale)}
        privacyHref={privacyPath(locale)}
      />
    </AccountShell>
  );
}

/** /jouw-tafel/welkom (EN /en/your-table/welcome), after either method.
 * The step after this (choosing a Sunday) is built later. */
export async function JouwTafelWelcomePage({ locale }: { locale: Locale }) {
  const user = await getMemberUser();
  if (!user) redirect(jouwTafelSignUpPath(locale));
  const copy = getLandingCopy(locale).auth.welcome;
  const isNew = isNewAuthUser(user.created_at);

  return (
    <AccountShell locale={locale}>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance">
        {copy.title}
      </h1>
      <p className="mt-4 text-[1.02rem] leading-relaxed text-wine/80">{isNew ? copy.created : copy.signedIn}</p>
      <p className="mt-2 text-[1.02rem] leading-relaxed text-wine/70">{copy.next}</p>
      <Link
        href={jouwTafelPath(locale)}
        className="mt-8 inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-wine/20 px-7 text-xs font-semibold uppercase tracking-[0.16em] text-wine/75 transition hover:border-wine/40 hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {copy.back}
      </Link>
    </AccountShell>
  );
}
