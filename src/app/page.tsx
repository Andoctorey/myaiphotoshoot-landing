'use client';

import { useEffect } from 'react';
import { redirect } from '@/i18n/routing';
import { useLanguageDetection } from '@/hooks/useLanguageDetection';

export default function Home() {
  const { detectedLocale, isDetecting } = useLanguageDetection();

  useEffect(() => {
    if (!isDetecting) {
      // Redirect to the detected locale
      redirect({ href: '/', locale: detectedLocale });
    }
  }, [detectedLocale, isDetecting]);

  // Show a loading state while detecting language and redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}
