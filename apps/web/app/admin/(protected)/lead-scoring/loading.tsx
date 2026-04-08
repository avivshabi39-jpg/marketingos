export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="h-6 w-16 bg-slate-200 rounded mb-3" />
            <div className="h-8 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 h-4 bg-slate-200 rounded" />
            <div className="w-24 h-3 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
