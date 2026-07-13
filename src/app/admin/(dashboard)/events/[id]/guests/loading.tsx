export default function EventGuestsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-72 rounded-lg bg-beige" />
      <div className="h-4 w-48 rounded bg-beige" />
      <div className="h-3 w-full max-w-md rounded-full bg-beige" />
      <div className="space-y-3 rounded-2xl border border-border-subtle bg-beige p-6">
        <div className="h-10 rounded-xl bg-cream" />
        <div className="h-10 rounded-xl bg-cream" />
        <div className="h-10 rounded-xl bg-cream" />
      </div>
    </div>
  );
}
