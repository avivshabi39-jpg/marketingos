import { StatCardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome bar skeleton */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          borderRadius: "16px",
          padding: "20px 24px",
          height: "80px",
        }}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div
          className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm"
          style={{ height: "280px" }}
        />
        <div
          className="bg-white rounded-xl border border-gray-100 shadow-sm"
          style={{ height: "280px" }}
        />
      </div>
    </div>
  );
}
