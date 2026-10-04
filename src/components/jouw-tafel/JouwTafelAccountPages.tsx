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
import {
  jouwTafelLogInPath,
  jouwTafelMembershipPath,
  jouwTafelPath,
  jouwTafelSignUpPath,
  jouwTafelStartPath,
  privacyPath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { devCountOverride, getWaitlistProof } from "@/lib/jouw-tafel/data";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import { isGoogleSignInAllowed, isInAppBrowser } from "@/lib/jouw-tafel/auth-logic";
import { isMembershipPlanId } from "@/lib/membership/plans";

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
  // Log in while signed in: go straight on. Sign up always starts fresh: an
  // existing session is ended in the browser (see startFresh) so a new
  // account never inherits someone else's name or answers.
  // ?naar=lid&plan=4m: started from "Word lid" on the membership page, so
  // the way back is that page with the plan still chosen.
  const toMembership = firstParam(searchParams.naar) === "lid";
  const planParam = firstParam(searchParams.plan);
  const plan = isMembershipPlanId(planParam) ? planParam : null;
  const nextPath = toMembership
    ? `${jouwTafelMembershipPath(locale)}${plan ? `?plan=${plan}` : ""}`
    : jouwTafelStartPath(locale);
  const carry = toMembership ? `?naar=lid${plan ? `&plan=${plan}` : ""}` : "";

  const signedIn = Boolean(await getMemberUser());
  if (signedIn && screen === "login") redirect(nextPath);

  const userAgent = (await headers()).get("user-agent");
  const inApp = isInAppBrowser(userAgent);
  const googleAllowed = isGoogleSignInAllowed({
    flag: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
    userAgent,
  });
  const proof = await getWaitlistProof(null, devCountOverride(searchParams.aantal));
  const proofText = proof ? getLandingCopy(locale).hero.proof(proof.count, null) : null;
  return (
    <AccountShell locale={locale}>
      <PlaceholderViewTracker kind={screen} locale={locale} />
      <JouwTafelAuthForm
        locale={locale}
        screen={screen}
        googleAllowed={googleAllowed}
        inApp={inApp}
        googleError={firstParam(searchParams.fout) === "google"}
        welcomePath={nextPath}
        switchPath={`${screen === "signup" ? jouwTafelLogInPath(locale) : jouwTafelSignUpPath(locale)}${carry}`}
        signUpPath={`${jouwTafelSignUpPath(locale)}${carry}`}
        termsHref={termsPath(locale)}
        privacyHref={privacyPath(locale)}
        proofText={proofText}
        startFresh={screen === "signup"}
        hadSession={signedIn}
      />
    </AccountShell>
  );
}

/** /jouw-tafel/welkom (EN /en/your-table/welcome): the old welcome page.
 * Kept so older links and emails work; it goes straight to the quiz, which
 * opens on "Kies je zondag" once the quiz is done. */
export async function JouwTafelWelcomePage({ locale }: { locale: Locale }): Promise<never> {
  const user = await getMemberUser();
  return redirect(user ? jouwTafelStartPath(locale) : jouwTafelSignUpPath(locale));
}
