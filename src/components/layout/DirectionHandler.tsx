'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RTL_LANGUAGES } from '@/lib/utils';

export default function DirectionHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Extract locale from pathname
    const locale = pathname?.split('/')[1] || 'en';
    
    // Determine if the current locale is RTL
    const isRTL = RTL_LANGUAGES.includes(locale);
    
    // Update the HTML element attributes
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('lang', locale);
    htmlElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [pathname]);

  // This component doesn't render anything
  return null;
} 