export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 bg-slate-100 rounded-lg" />
              <div className="h-8 flex-1 bg-slate-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
