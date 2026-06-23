export function GirlsOnlyLandingSkeleton() {
  return (
    <div className="space-y-16 px-5 py-10 sm:space-y-20 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-wine/10" />
        <div className="mx-auto h-12 w-full max-w-xl animate-pulse rounded-lg bg-wine/10" />
        <div className="mx-auto h-5 w-full max-w-md animate-pulse rounded-lg bg-wine/10" />
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-border-subtle bg-beige"
          >
            <div className="aspect-[2/1] animate-pulse bg-wine/10" />
            <div className="space-y-3 p-4">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-wine/10" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-wine/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
