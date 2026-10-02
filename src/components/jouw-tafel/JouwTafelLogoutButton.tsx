"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackJouwTafelLogout } from "@/lib/posthog/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** "Uitloggen" on the welcome page: ends the session and goes back to the
 * landing page. */
export function JouwTafelLogoutButton({
  label,
  busyLabel,
  redirectTo,
  locale,
}: {
  label: string;
  busyLabel: string;
  redirectTo: string;
  locale: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logOut() {
    setBusy(true);
    trackJouwTafelLogout({ locale });
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      router.replace(redirectTo);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logOut}
      disabled={busy}
      className="mt-4 inline-flex min-h-11 items-center justify-center px-3 text-xs font-semibold uppercase tracking-[0.16em] text-wine/60 underline-offset-4 transition hover:text-wine hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60 disabled:opacity-60"
    >
      {busy ? busyLabel : label}
    </button>
  );
}
