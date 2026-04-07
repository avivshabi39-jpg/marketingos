export default function AppointmentsLoading() {
  return (
    <div className="space-y-5 p-4" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="h-7 w-40 rounded-lg bg-gray-200 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-9 w-20 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
