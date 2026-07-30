"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { MemberBottomNav } from "@/components/MemberBottomNav";

export function MemberShell({
  children,
  locale,
  nav,
}: {
  children: ReactNode;
  locale: Locale;
  nav: Dictionary["header"]["nav"];
}) {
  const { isSignedIn, loading } = useAuthSession();
  const showMemberNav = !loading && isSignedIn;

  return (
    <>
      <div
        className={
          showMemberNav
            ? "pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0"
            : undefined
        }
      >
        {children}
      </div>
      {showMemberNav ? <MemberBottomNav locale={locale} nav={nav} /> : null}
    </>
  );
}
