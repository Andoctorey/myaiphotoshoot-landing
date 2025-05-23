import { useTranslations as useNextIntlTranslations, useLocale as useNextIntlLocale } from 'next-intl';
import { locales } from '@/i18n/request';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// RTL language codes
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Helper function to get the current locale from the pathname
export function getLocaleFromPathname(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return 'en'; // Default to English
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

export function useLocale() {
  return useNextIntlLocale();
}

// RTL detection utilities
export function isRTLLanguage(locale: string): boolean {
  return RTL_LANGUAGES.includes(locale);
}

export function useIsRTL(): boolean {
  const locale = useLocale();
  return isRTLLanguage(locale);
}

export function getDirectionClass(locale: string): string {
  return isRTLLanguage(locale) ? 'rtl' : 'ltr';
} 