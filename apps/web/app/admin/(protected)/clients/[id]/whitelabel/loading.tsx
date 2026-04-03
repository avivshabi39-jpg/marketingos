export default function WhitelabelLoading() {
  return (
    <div className="space-y-8 max-w-3xl animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 bg-gray-200 rounded" />
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3 w-36 bg-gray-100 rounded mt-1.5" />
        </div>
      </div>

      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-52 bg-gray-100 rounded mt-1.5" />
          </div>
          <div className="p-6 space-y-4">
            <div className="h-9 bg-gray-100 rounded-lg" />
            <div className="h-9 bg-gray-100 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-9 bg-gray-100 rounded-lg" />
              <div className="h-9 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      ))}

      {/* Save button skeleton */}
      <div className="flex justify-end pb-8">
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
