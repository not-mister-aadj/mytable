"use client";

import type { Provider } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBrowserMemberAuthCallbackUrl } from "@/lib/member-url";

async function signInWithOAuthProvider(
  provider: Provider,
  nextPath: string,
  options?: { scopes?: string; queryParams?: Record<string, string> },
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${getBrowserMemberAuthCallbackUrl()}?next=${encodeURIComponent(nextPath)}`;
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
