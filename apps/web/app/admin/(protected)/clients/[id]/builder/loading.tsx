export default function BuilderLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-sm text-gray-500">טוען את הבונה...</p>
      </div>
    </div>
  );
}
