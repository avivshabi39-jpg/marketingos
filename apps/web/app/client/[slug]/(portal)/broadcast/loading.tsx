import { BroadcastCardSkeleton } from "@/components/ui/Skeleton";

export default function BroadcastLoading() {
  return (
    <div className="space-y-5 p-4" dir="rtl">
      <div className="h-7 w-32 rounded-lg bg-slate-200 animate-pulse" />
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3">
        <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-20 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-10 w-32 rounded-lg bg-slate-200 animate-pulse" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <BroadcastCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
