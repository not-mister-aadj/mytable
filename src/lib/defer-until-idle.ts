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
  let idleId: number | undefined;
  let timeoutId = 0;

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

  if (typeof window.requestIdleCallback === "function") {
    idleId = window.requestIdleCallback(() => run(), { timeout: timeoutMs });
  }

  timeoutId = window.setTimeout(run, timeoutMs);

  function cleanup() {
    for (const event of events) {
      window.removeEventListener(event, onInteract);
    }
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
