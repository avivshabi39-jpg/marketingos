export default function OfficeDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="space-y-1.5">
              <div className="h-5 w-12 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="flex-1 bg-gray-100 rounded-full h-4" />
            <div className="h-3 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-1 text-center">
                  <div className="h-5 w-8 bg-gray-200 rounded mx-auto" />
                  <div className="h-3 w-12 bg-gray-100 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
