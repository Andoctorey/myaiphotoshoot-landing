export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-purple-600 border-t-transparent" role="status" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
} 