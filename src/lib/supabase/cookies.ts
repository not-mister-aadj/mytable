/** e.g. lptiylzvkiodxmupkdbm from https://lptiylzvkiodxmupkdbm.supabase.co */
export function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

type CookieLike = { name: string; value: string };

/** Drop auth cookies from other Supabase projects (common after switching prod → dev on localhost). */
export function clearStaleSupabaseAuthCookies(
  cookies: CookieLike[],
  deleteCookie: (name: string) => void,
): void {
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) return;

  const prefix = `sb-${projectRef}-`;
  for (const cookie of cookies) {
    if (cookie.name.startsWith("sb-") && !cookie.name.startsWith(prefix)) {
      deleteCookie(cookie.name);
    }
  }
}
