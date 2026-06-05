export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-8 w-48 rounded-lg bg-brand-green/10" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-white/80" />
        <div className="h-28 rounded-2xl bg-white/80" />
      </div>
      <div className="space-y-3">
        <div className="h-14 rounded-2xl bg-white/80" />
        <div className="h-32 rounded-2xl bg-white/80" />
        <div className="h-32 rounded-2xl bg-white/80" />
      </div>
    </div>
  );
}
