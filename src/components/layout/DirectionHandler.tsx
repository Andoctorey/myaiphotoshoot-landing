'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleFromPathname, isRTLLanguage } from '@/lib/utils';

export default function DirectionHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const locale = getLocaleFromPathname(pathname ?? '/');
    const isRTL = isRTLLanguage(locale);

    const htmlElement = document.documentElement;
    htmlElement.setAttribute('lang', locale);
    htmlElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [pathname]);

  return null;
}
