export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-8 w-56 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-24 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
