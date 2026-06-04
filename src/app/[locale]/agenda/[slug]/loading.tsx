export default function ExperienceDetailLoading() {
  return (
    <>
      <div className="sticky top-0 z-40 h-16 animate-pulse border-b border-border-subtle/60 bg-cream/90" />
      <main className="bg-cream">
        <div className="relative aspect-[4/3] w-full animate-pulse bg-wine/10 sm:aspect-[21/9]" />
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-wine/10" />
            <div className="h-10 w-4/5 max-w-lg animate-pulse rounded-lg bg-wine/10" />
            <div className="h-5 w-2/3 animate-pulse rounded-lg bg-wine/10" />
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-2xl bg-wine/5" />
              <div className="h-32 animate-pulse rounded-2xl bg-wine/5" />
              <div className="h-48 animate-pulse rounded-2xl bg-wine/5" />
            </div>
            <div className="hidden h-72 animate-pulse rounded-2xl bg-wine/5 lg:block" />
          </div>
        </div>
      </main>
    </>
  );
}
