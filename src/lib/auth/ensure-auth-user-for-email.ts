import { after } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type EnsureAuthUserResult = {
  userId: string | null;
  created: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAlreadyRegisteredError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists") ||
    lower.includes("email_exists")
  );
}

/**
 * Ensure a Supabase auth user exists for a guest checkout email.
 * Idempotent: existing users are left untouched. Failures should not block fulfill.
 */
export async function ensureAuthUserForEmail(input: {
  email: string;
  name?: string | null;
  /** Where they signed up; "guest_checkout" (a ticket) by default. */
  source?: SilentSource | "guest_checkout";
  city?: string | null;
  locale?: string | null;
}): Promise<EnsureAuthUserResult> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    return { userId: null, created: false };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.warn(
      "[auth] ensureAuthUserForEmail skipped: Supabase admin not configured",
    );
    return { userId: null, created: false };
  }

  const name = input.name?.trim() || undefined;
  const source = input.source ?? "guest_checkout";
  const city = input.city?.trim() || undefined;
  const locale = input.locale === "en" ? "en" : input.locale === "nl" ? "nl" : undefined;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      ...(name ? { full_name: name, name } : {}),
      ...(city ? { city } : {}),
      ...(locale ? { locale } : {}),
      source,
      // Made in the background: it stays out of sight (the quiz still treats
      // them as a guest) until they log in themselves (see clearSilentFlag).
      ...(source !== "guest_checkout" ? { silent: true } : {}),
    },
  });

  if (!error && data.user?.id) {
    return { userId: data.user.id, created: true };
  }

  if (error && isAlreadyRegisteredError(error.message)) {
    return { userId: null, created: false };
  }

  if (error) {
    console.error("[auth] ensureAuthUserForEmail failed", {
      email,
      message: error.message,
      status: error.status,
    });
  }

  return { userId: null, created: false };
}

export type SilentSource = "waitlist" | "notify" | "quiz";

/**
 * Every signup gets an account in the background, without any mail, so
 * logging in works for everyone on the list. Runs after the response (or
 * right away outside a request) and never fails the signup.
 */
export function ensureAccountInBackground(input: {
  email: string;
  source: SilentSource;
  name?: string | null;
  city?: string | null;
  locale?: string | null;
}): void {
  const run = () =>
    ensureAuthUserForEmail(input).catch((error: unknown) => {
      console.error("[auth] background account failed", error);
    });
  try {
    after(run);
  } catch {
    void run();
  }
}

/** Their first own login: the background account becomes a normal one. */
export async function clearSilentFlag(user: { id: string; user_metadata?: Record<string, unknown> | null }): Promise<void> {
  const meta = user.user_metadata ?? {};
  if (meta.silent !== true) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  await createSupabaseAdminClient()
    .auth.admin.updateUserById(user.id, { user_metadata: { ...meta, silent: false, first_login_at: new Date().toISOString() } })
    .catch(() => undefined);
}
