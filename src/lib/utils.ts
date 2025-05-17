import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/request';

// Helper function to get the current locale from the pathname
export function getLocaleFromPathname(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return 'en'; // Default to English
}

// Export useTranslations for easy access
export { useTranslations, useLocale }; 