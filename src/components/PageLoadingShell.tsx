export function PageLoadingShell() {
  return (
    <>
      <div className="sticky top-0 z-40 h-16 animate-pulse border-b border-border-subtle/60 bg-cream/90" />
      <main className="bg-cream">
        <div className="border-b border-border-subtle bg-cream px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-3 w-24 animate-pulse rounded-full bg-wine/10" />
            <div className="h-10 w-4/5 max-w-xl animate-pulse rounded-lg bg-wine/10" />
            <div className="h-5 w-2/3 max-w-md animate-pulse rounded-lg bg-wine/10" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse overflow-hidden rounded-[1.75rem] bg-wine/10 sm:rounded-[2rem]"
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
