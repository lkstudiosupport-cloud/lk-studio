export default function ShopDesignsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-zinc-200" />
        <div className="h-4 w-full max-w-md rounded bg-zinc-100" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="min-h-[4.5rem] rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
