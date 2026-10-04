import type { ReactNode } from "react";
import { PostHogConcept } from "@/components/analytics/PostHogConcept";

/** The account funnel: every PostHog event here carries concept "account". */
export default function AccountConceptLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PostHogConcept concept="account" />
      {children}
    </>
  );
}
