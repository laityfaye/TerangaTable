export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="h-7 w-48 bg-stone-200 rounded-md mb-6" />

      {/* Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-stone-100 rounded-xl border border-stone-200" />
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="h-72 bg-stone-100 rounded-xl border border-stone-200" />
      </div>
    </div>
  );
}
