"use client";

import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/features/auth/AuthSessionContext";
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
  // Sign-in is paused site-wide — there's no reachable path into an auth
  // modal (the modal, its query-param opener, and the whole post-login
  // onboarding flow were removed). AuthSessionProvider stays: useAuthSession()
  // is still live for prefilling checkout, the language switcher, etc.
  void locale;
  void nav;
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
