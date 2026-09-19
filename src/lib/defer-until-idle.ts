/**
 * Defer non-critical work until the browser is idle, the user interacts,
 * or a timeout elapses — whichever comes first.
 */
export function deferUntilIdle(
  callback: () => void,
  timeoutMs = 2500,
): () => void {
  if (typeof window === "undefined") return () => {};

  let done = false;
  let cancelled = false;
  let idleId: number | undefined;
  let timeoutId = 0;
  let rafId1 = 0;
  let rafId2 = 0;

  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    callback();
  };

  const onInteract = () => run();
  const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

  for (const event of events) {
    window.addEventListener(event, onInteract, { once: true, passive: true });
  }

  // Wait a couple of paint cycles before arming the idle/timeout triggers.
  // Third-party scripts that mutate the DOM (like PostHog inserting its own
  // <script> tags) can otherwise fire while a sibling subtree is still
  // hydrating, which surfaces as a spurious hydration-mismatch warning.
  rafId1 = window.requestAnimationFrame(() => {
    rafId2 = window.requestAnimationFrame(() => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => run(), { timeout: timeoutMs });
      }
    });
  });

  timeoutId = window.setTimeout(run, timeoutMs);

  function cleanup() {
    cancelled = true;
    for (const event of events) {
      window.removeEventListener(event, onInteract);
    }
    window.cancelAnimationFrame(rafId1);
    window.cancelAnimationFrame(rafId2);
    if (
      idleId !== undefined &&
      typeof window.cancelIdleCallback === "function"
    ) {
      window.cancelIdleCallback(idleId);
    }
    window.clearTimeout(timeoutId);
  }

  return cleanup;
}
