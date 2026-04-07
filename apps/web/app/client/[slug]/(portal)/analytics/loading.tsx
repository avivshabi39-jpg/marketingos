import { StatCardSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="h-7 w-28 rounded-lg bg-gray-200 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 h-72 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 h-72 animate-pulse" />
      </div>
    </div>
  );
}
