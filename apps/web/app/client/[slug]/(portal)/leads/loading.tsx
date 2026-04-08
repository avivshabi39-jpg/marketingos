import { LeadCardSkeleton } from "@/components/ui/Skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-5 p-4" dir="rtl">
      <div className="h-7 w-32 rounded-lg bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 h-[72px] animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <LeadCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
