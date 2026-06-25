export default function CustomerDesignsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-lg bg-zinc-200" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-h-[4.5rem] rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="aspect-[4/3] bg-zinc-200" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-16 rounded bg-zinc-100" />
              <div className="h-4 w-3/4 rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
