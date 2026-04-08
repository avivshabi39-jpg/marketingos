export default function AutomationsLoading() {
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="h-7 w-36 rounded-lg bg-slate-200 animate-pulse" />
      <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 h-20 animate-pulse" />
      ))}
    </div>
  );
}
