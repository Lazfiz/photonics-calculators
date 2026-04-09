export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 bg-gray-800 rounded w-48" />
        <div className="h-4 bg-gray-800 rounded w-72" />
        <div className="grid gap-4 sm:grid-cols-3 mt-8">
          <div className="h-24 bg-gray-800 rounded-lg" />
          <div className="h-24 bg-gray-800 rounded-lg" />
          <div className="h-24 bg-gray-800 rounded-lg" />
        </div>
        <div className="h-64 bg-gray-800 rounded-lg" />
      </div>
    </div>
  );
}
