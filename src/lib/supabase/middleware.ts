import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { clearStaleSupabaseAuthCookies } from "@/lib/supabase/cookies";

function deleteStaleSupabaseCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  clearStaleSupabaseAuthCookies(request.cookies.getAll(), (name) => {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  });
}

export async function updateSupabaseSession(
  request: NextRequest,
  options?: { rewritePath?: string },
) {
  const rewritePath = options?.rewritePath;

  function buildResponse(): NextResponse {
    if (!rewritePath) {
      return NextResponse.next({ request });
    }
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewritePath.split("?")[0] || rewritePath;
    return NextResponse.rewrite(rewriteUrl);
  }

  let response = buildResponse();

  deleteStaleSupabaseCookies(request, response);

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
        response = buildResponse();
        deleteStaleSupabaseCookies(request, response);
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          response.cookies.set(name, value, cookieOptions),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

/** Session refresh + optional auth user (for marketing route gates). */
export async function updateSupabaseSessionWithUser(
  request: NextRequest,
  options?: { rewritePath?: string },
) {
  const rewritePath = options?.rewritePath;

  function buildResponse(): NextResponse {
    if (!rewritePath) {
      return NextResponse.next({ request });
    }
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewritePath.split("?")[0] || rewritePath;
    return NextResponse.rewrite(rewriteUrl);
  }

  let response = buildResponse();

  deleteStaleSupabaseCookies(request, response);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { response, user: null };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = buildResponse();
        deleteStaleSupabaseCookies(request, response);
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          response.cookies.set(name, value, cookieOptions),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { response, user };
}
