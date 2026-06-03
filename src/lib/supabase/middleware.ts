import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSupabaseSession(
  request: NextRequest,
  options?: { rewritePath?: string },
) {
  const rewritePath = options?.rewritePath;
  let response = rewritePath
    ? NextResponse.rewrite(new URL(rewritePath, request.url))
    : NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = rewritePath
          ? NextResponse.rewrite(new URL(rewritePath, request.url))
          : NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          response.cookies.set(name, value, cookieOptions),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
