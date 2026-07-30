"use client";

import { Suspense, type ReactNode } from "react";
import { AuthSessionProvider } from "@/features/auth/AuthSessionContext";
import { SignInProvider } from "@/features/auth/SignInProvider";
import { SignInQueryOpener } from "@/features/auth/SignInQueryOpener";
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
      <SignInProvider locale={locale}>
        <Suspense fallback={null}>
          <SignInQueryOpener />
        </Suspense>
        <MemberShell locale={locale} nav={nav}>
          {children}
        </MemberShell>
      </SignInProvider>
    </AuthSessionProvider>
  );
}
