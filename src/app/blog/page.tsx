'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to English blog by default
    router.replace('/en/blog');
  }, [router]);

  // Show a simple loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirecting to blog...</p>
      </div>
    </div>
  );
} 