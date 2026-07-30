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
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      ...(name ? { full_name: name, name } : {}),
      source: "guest_checkout",
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
