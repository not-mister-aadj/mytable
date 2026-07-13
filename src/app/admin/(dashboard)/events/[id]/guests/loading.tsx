export default function EventGuestsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="overflow-hidden rounded-3xl border border-border-subtle/80 bg-beige/60">
        <div className="space-y-4 border-b border-border-subtle/60 px-6 py-5 sm:px-8">
          <div className="h-4 w-32 rounded bg-cream" />
          <div className="h-10 w-72 max-w-full rounded-xl bg-cream" />
          <div className="h-4 w-48 rounded bg-cream" />
        </div>
        <div className="px-6 py-5 sm:px-8">
          <div className="h-3 w-full rounded-full bg-cream" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border-subtle/80 bg-beige/60"
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-8 w-40 rounded-lg bg-beige" />
        <div className="h-11 w-full max-w-xs rounded-full bg-beige" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-2xl border border-border-subtle/80 bg-beige/60"
          />
        ))}
      </div>
    </div>
  );
}
