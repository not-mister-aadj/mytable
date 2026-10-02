"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackJouwTafelLogout } from "@/lib/posthog/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const defaultClass =
  "mt-4 inline-flex min-h-11 items-center justify-center px-3 text-xs font-semibold uppercase tracking-[0.16em] text-wine/60 underline-offset-4 transition hover:text-wine hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60 disabled:opacity-60";

/** "Uitloggen" in the quiz: ends the session and goes back to the landing
 * page. `onBeforeLogout` runs first (tracking, saving what is pending). */
export function JouwTafelLogoutButton({
  label,
  busyLabel,
  redirectTo,
  locale,
  className = defaultClass,
  role,
  onBeforeLogout,
}: {
  label: string;
  busyLabel: string;
  redirectTo: string;
  locale: string;
  className?: string;
  role?: "menuitem";
  onBeforeLogout?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logOut() {
    if (busy) return;
    setBusy(true);
    trackJouwTafelLogout({ locale });
    try {
      await onBeforeLogout?.();
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      router.replace(redirectTo);
      router.refresh();
    }
  }

  return (
    <button type="button" role={role} onClick={() => void logOut()} disabled={busy} className={className}>
      {busy ? busyLabel : label}
    </button>
  );
}
