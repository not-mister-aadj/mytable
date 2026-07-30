"use client";

import type { Provider } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const APPLE_WEB_OAUTH_CLIENT_ID =
  process.env.NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID?.trim() || "";

async function signInWithOAuthProvider(
  provider: Provider,
  nextPath: string,
  options?: { scopes?: string; queryParams?: Record<string, string> },
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: options?.scopes,
      queryParams: options?.queryParams,
    },
  });
  if (error) throw error;
}

export async function signInWithGoogle(nextPath: string): Promise<void> {
  await signInWithOAuthProvider("google", nextPath, {
    queryParams: { prompt: "select_account" },
  });
}

export async function signInWithApple(nextPath: string): Promise<void> {
  await signInWithOAuthProvider("apple", nextPath, {
    scopes: "name email",
    queryParams: APPLE_WEB_OAUTH_CLIENT_ID
      ? { client_id: APPLE_WEB_OAUTH_CLIENT_ID }
      : undefined,
  });
}
