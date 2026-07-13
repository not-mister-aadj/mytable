export default function EditEventLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-9 w-56 rounded-lg bg-beige" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border-subtle bg-beige p-6">
          <div className="h-6 w-32 rounded bg-cream" />
          <div className="h-10 rounded-xl bg-cream" />
          <div className="h-10 rounded-xl bg-cream" />
          <div className="h-10 rounded-xl bg-cream" />
          <div className="h-24 rounded-xl bg-cream" />
        </div>
        <div className="h-[480px] rounded-2xl border border-border-subtle bg-beige" />
      </div>
    </div>
  );
}
