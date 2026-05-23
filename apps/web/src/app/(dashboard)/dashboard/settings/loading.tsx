export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div className="h-7 w-36 bg-stone-200 rounded-md" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-28 bg-stone-200 rounded" />
          <div className="h-10 bg-stone-100 rounded-lg border border-stone-200" />
        </div>
      ))}
      <div className="h-10 w-32 bg-stone-200 rounded-lg" />
    </div>
  );
}
