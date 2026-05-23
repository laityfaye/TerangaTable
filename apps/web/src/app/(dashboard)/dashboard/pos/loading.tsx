export default function PosLoading() {
  return (
    <div className="animate-pulse flex gap-4 h-[calc(100vh-112px)]">
      {/* Catalogue produits */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-10 bg-stone-200 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-stone-200 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 content-start">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-xl border border-stone-200" />
          ))}
        </div>
      </div>
      {/* Panier */}
      <div className="w-80 flex flex-col gap-3 flex-shrink-0">
        <div className="h-10 bg-stone-200 rounded-lg" />
        <div className="flex-1 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="h-32 bg-stone-200 rounded-xl" />
      </div>
    </div>
  );
}
