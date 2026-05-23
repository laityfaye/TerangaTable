export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-40 bg-stone-200 rounded-md" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-stone-100 rounded-xl border border-stone-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="h-72 bg-stone-100 rounded-xl border border-stone-200" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-60 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="h-60 bg-stone-100 rounded-xl border border-stone-200" />
      </div>
    </div>
  );
}
