import { adminPath, adminUrl } from "@/lib/admin-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    if (user) {
      await supabase.auth.signOut();
    }
    redirect(
      user?.email
        ? adminUrl("/login?error=unauthorized")
        : adminUrl("/login"),
    );
  }
  return { supabase, user };
}

export async function getAdminUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email || !isAdminEmail(user.email)) return null;
    return user;
  } catch {
    return null;
  }
}
