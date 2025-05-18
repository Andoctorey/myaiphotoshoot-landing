export default function PhotoLoading() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center animate-pulse">
          <div className="inline-block w-48 h-8 bg-purple-200 dark:bg-purple-800 rounded"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="relative aspect-square w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 