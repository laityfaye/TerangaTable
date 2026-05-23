export default function OrdersLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-stone-200 rounded-md" />
        <div className="h-9 w-36 bg-stone-200 rounded-lg" />
      </div>
      {/* Kanban columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="h-8 bg-stone-200 rounded-lg" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-28 bg-stone-100 rounded-xl border border-stone-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
