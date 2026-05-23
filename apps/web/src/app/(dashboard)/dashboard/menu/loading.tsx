export default function MenuLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-stone-200 rounded-md" />
        <div className="h-9 w-40 bg-stone-200 rounded-lg" />
      </div>
      {/* Catégories */}
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 w-28 bg-stone-100 rounded-xl border border-stone-200" />
        ))}
      </div>
      {/* Produits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 bg-stone-100 rounded-xl border border-stone-200" />
        ))}
      </div>
    </div>
  );
}
