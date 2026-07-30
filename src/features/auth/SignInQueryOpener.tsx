"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { useSignIn } from "@/features/auth/SignInProvider";

/** Opens the login modal when URL has `?signin=1` (BeSquare pattern). */
export function SignInQueryOpener(): null {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { startSignIn } = useSignIn();
  const { isSignedIn, loading } = useAuthSession();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (searchParams.get("signin") !== "1") return;
    if (loading) return;
    handled.current = true;

    if (!isSignedIn) {
      startSignIn();
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("signin");
    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [isSignedIn, loading, pathname, router, searchParams, startSignIn]);

  return null;
}
