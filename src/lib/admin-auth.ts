import { NextResponse } from "next/server";
import { adminUrlForHost } from "@/lib/admin-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

async function redirectToAdmin(path: string): Promise<never> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? "http";
  redirect(adminUrlForHost(path, host, proto));
}

export async function requireAdmin(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    if (user) {
      await supabase.auth.signOut();
    }
    await redirectToAdmin(
      user?.email ? "/login?error=unauthorized" : "/login",
    );
  }
  return { supabase, user: user! };
}

/** JSON API routes — returns 401 response or null if allowed */
export async function requireAdminApi() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
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
