"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/features/auth/LoginModal";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { getAccountPageLabels } from "@/i18n/get-account-page";
import { type Locale } from "@/i18n/config";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { postLoginPath } from "@/lib/member-onboarding";

interface SignInContextValue {
  startSignIn: () => void;
  closeSignIn: () => void;
}

const SignInContext = createContext<SignInContextValue | null>(null);

export function SignInProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { refreshAuthSession, isSignedIn } = useAuthSession();
  const labels = getAccountPageLabels(locale);

  const startSignIn = useCallback(() => {
    if (isSignedIn) return;
    setOpen(true);
  }, [isSignedIn]);

  const closeSignIn = useCallback(() => setOpen(false), []);

  const onAuthenticated = useCallback(async () => {
    setOpen(false);
    const user = await refreshAuthSession();
    if (user) {
      void syncMemberCustomerClient(locale);
    }
    router.replace(postLoginPath(locale, null));
    router.refresh();
  }, [locale, refreshAuthSession, router]);

  const value = useMemo(
    () => ({ startSignIn, closeSignIn }),
    [startSignIn, closeSignIn],
  );

  return (
    <SignInContext.Provider value={value}>
      {children}
      <LoginModal
        open={open}
        locale={locale}
        labels={labels.auth}
        onClose={closeSignIn}
        onAuthenticated={() => void onAuthenticated()}
      />
    </SignInContext.Provider>
  );
}

export function useSignIn(): SignInContextValue {
  const ctx = useContext(SignInContext);
  if (!ctx) {
    return {
      startSignIn: () => {},
      closeSignIn: () => {},
    };
  }
  return ctx;
}
