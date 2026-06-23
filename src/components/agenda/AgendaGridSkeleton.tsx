export function AgendaGridSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-wine/10" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-lg bg-wine/10" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-7">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-border-subtle bg-beige"
          >
            <div className="aspect-[2/1] animate-pulse bg-wine/10" />
            <div className="space-y-3 p-4">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-wine/10" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-wine/10" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-wine/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
