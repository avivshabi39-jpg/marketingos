// Skeleton לדשבורד בזמן טעינה
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="h-10 w-10 bg-gray-100 rounded-lg mb-4" />
            <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm h-72" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-72" />
      </div>
    </div>
  );
}
