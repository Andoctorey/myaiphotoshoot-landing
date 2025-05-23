import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is one of our supported locales
  const resolvedLocale = locales.includes(locale as Locale) 
    ? locale as Locale 
    : defaultLocale;
  
  // Load messages for the requested locale
  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}/index.json`)).default
  };
}); 