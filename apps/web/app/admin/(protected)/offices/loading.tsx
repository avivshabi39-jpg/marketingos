export default function OfficesLoading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-gray-50 rounded-lg py-3 space-y-1.5 flex flex-col items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                  <div className="h-4 w-6 bg-gray-200 rounded" />
                  <div className="h-2.5 w-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
