export default function SettingsLoading() {
  return (
    <div className="space-y-5 p-4" dir="rtl">
      <div className="h-7 w-24 rounded-lg bg-gray-200 animate-pulse" />
      <div className="flex gap-2 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse mb-2" />
            <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
