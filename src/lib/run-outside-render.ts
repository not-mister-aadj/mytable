/**
 * Runs `work` now. Where that is refused (Next.js throws on revalidateTag and
 * revalidatePath while a page renders), it is handed to `defer` (next/server
 * `after`), so it runs once the response is out. Never both: `work` throws
 * before it changes anything.
 *
 * Without a place to defer to (a script, outside a request) the first error
 * is thrown, as before.
 */
export function runOutsideRender(
  work: () => void,
  defer: (callback: () => void) => void,
): "now" | "deferred" {
  try {
    work();
    return "now";
  } catch (error) {
    try {
      defer(work);
    } catch {
      throw error;
    }
    return "deferred";
  }
}
