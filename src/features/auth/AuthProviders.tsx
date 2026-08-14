"use client";

import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/features/auth/AuthSessionContext";
import { SignInProvider } from "@/features/auth/SignInProvider";
import { MemberShell } from "@/components/MemberShell";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

export function AuthProviders({
  children,
  locale,
  nav,
}: {
  children: ReactNode;
  locale: Locale;
  nav: Dictionary["header"]["nav"];
}) {
  return (
    <AuthSessionProvider>
      {/* Sign-in is paused site-wide — SignInQueryOpener (?signin=1) is no
       * longer mounted, so there's no reachable path into the auth modal.
       * See src/app/[locale]/login/page.tsx for the coming-soon page. */}
      <SignInProvider locale={locale}>
        <MemberShell>{children}</MemberShell>
      </SignInProvider>
    </AuthSessionProvider>
  );
}
