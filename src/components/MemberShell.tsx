import type { ReactNode } from "react";

/** Sign-in is paused site-wide, so there's no member destination left to
 * show a member bottom nav for — this is now a passthrough. Kept as a
 * named component so AuthProviders doesn't need restructuring if member
 * areas come back later. */
export function MemberShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
