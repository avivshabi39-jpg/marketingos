export default function Loading() {
  return (
    <div className="space-y-4 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-16 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-1 border-b border-slate-200 pb-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-slate-100 rounded-t animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-100 h-64 animate-pulse" />
    </div>
  );
}
