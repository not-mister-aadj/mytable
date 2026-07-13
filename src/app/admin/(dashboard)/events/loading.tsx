export default function AdminEventsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-40 rounded-lg bg-beige" />
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-56 rounded-full bg-beige" />
        <div className="h-10 w-36 rounded-full bg-beige" />
        <div className="h-10 w-36 rounded-full bg-beige" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-border-subtle bg-beige"
          />
        ))}
      </div>
    </div>
  );
}
