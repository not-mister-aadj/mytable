import type { ReactNode } from "react";
import { PostHogConcept } from "@/components/analytics/PostHogConcept";

/** The waitlist funnel's landing pages: PostHog events carry concept "waitlist". */
export default function WaitlistConceptLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PostHogConcept concept="waitlist" />
      {children}
    </>
  );
}
