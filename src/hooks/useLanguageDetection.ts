import { useEffect, useState } from 'react';
import { defaultLocale, type Locale } from '@/i18n/request';
import { detectBrowserLanguage } from '@/lib/languageStorage';

export function useLanguageDetection() {
  const [detectedLocale, setDetectedLocale] = useState<Locale>(defaultLocale);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      setIsDetecting(false);
      return;
    }

    const selectedLocale = detectBrowserLanguage();
    setDetectedLocale(selectedLocale);
    setIsDetecting(false);
  }, []);

  return { detectedLocale, isDetecting };
} 