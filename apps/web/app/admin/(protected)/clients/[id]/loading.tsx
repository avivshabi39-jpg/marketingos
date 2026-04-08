export default function Loading() {
  return (
    <div className="space-y-4" dir="rtl">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 h-24 animate-pulse" />
      ))}
    </div>
  );
}
