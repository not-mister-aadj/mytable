/** Shown while the quiz loads (right after signing in, the first screen
 * someone sees), so a slow moment never looks like a frozen page. No
 * locale here: loading.tsx gets no params, so no words on screen. */
export default function JouwTafelStartLoading() {
  return (
    <div role="status" className="flex min-h-[100svh] items-center justify-center bg-cream">
      <span className="sr-only">Even geduld / Loading</span>
      <span aria-hidden className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-burgundy/70 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
