export function AgendaGridSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-3xl xl:max-w-4xl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-wine/10" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-lg bg-wine/10" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[16/10] animate-pulse overflow-hidden rounded-[1.5rem] bg-wine/10 sm:aspect-[4/3]"
          />
        ))}
      </div>
    </div>
  );
}
