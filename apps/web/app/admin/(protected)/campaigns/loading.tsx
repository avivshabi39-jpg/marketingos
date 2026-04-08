export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="aspect-video bg-slate-200 rounded-lg" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
