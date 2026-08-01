"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthSessionContextValue {
  user: User | null;
  loading: boolean;
  isSignedIn: boolean;
  refreshAuthSession: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const AUTH_SESSION_FALLBACK: AuthSessionContextValue = {
  user: null,
  loading: true,
  isSignedIn: false,
  refreshAuthSession: async () => null,
  signOut: async () => {},
};

const VISIBILITY_REFRESH_MIN_HIDDEN_MS = 60_000;

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hiddenAtRef = useRef<number | null>(null);

  const refreshAuthSession = useCallback(async (): Promise<User | null> => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getUser();
      const nextUser = error ? null : data.user;
      setUser((prev) => {
        const prevId = prev?.id ?? null;
        const nextId = nextUser?.id ?? null;
        if (prevId !== nextId) return nextUser;
        // Same user: still refresh when metadata changed (e.g. onboarding).
        if (
          prev &&
          nextUser &&
          JSON.stringify(prev.user_metadata) ===
            JSON.stringify(nextUser.user_metadata)
        ) {
          return prev;
        }
        return nextUser;
      });
      setLoading(false);
      return nextUser;
    } catch {
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setUser(null);
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    const bootstrap = (): void => {
      if (!cancelled) void refreshAuthSession();
    };

    const idleHandle =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(bootstrap)
        : null;
    const fallbackTimer =
      idleHandle == null ? window.setTimeout(bootstrap, 100) : null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
      if (
        idleHandle != null &&
        typeof cancelIdleCallback !== "undefined"
      ) {
        cancelIdleCallback(idleHandle);
      }
      subscription.unsubscribe();
    };
  }, [refreshAuthSession]);

  useEffect(() => {
    const onVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;
      if (Date.now() - hiddenAt >= VISIBILITY_REFRESH_MIN_HIDDEN_MS) {
        void refreshAuthSession();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshAuthSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isSignedIn: Boolean(user),
      refreshAuthSession,
      signOut,
    }),
    [user, loading, refreshAuthSession, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext) ?? AUTH_SESSION_FALLBACK;
}
