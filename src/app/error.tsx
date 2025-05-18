'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <div className="p-6 max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
        <p className="text-gray-700 dark:text-gray-300 text-center">
          The application encountered an unexpected error.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 