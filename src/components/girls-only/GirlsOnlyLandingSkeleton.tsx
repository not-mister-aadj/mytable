export function GirlsOnlyLandingSkeleton() {
  return (
    <div className="space-y-16 px-5 py-10 sm:space-y-20 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-wine/10" />
        <div className="mx-auto h-12 w-full max-w-xl animate-pulse rounded-lg bg-wine/10" />
        <div className="mx-auto h-5 w-full max-w-md animate-pulse rounded-lg bg-wine/10" />
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse overflow-hidden rounded-[1.75rem] bg-wine/10 sm:rounded-[2rem]"
          />
        ))}
      </div>
    </div>
  );
}
