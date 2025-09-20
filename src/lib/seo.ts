export const BASE_URL = 'https://myaiphotoshoot.com';

/** Returns a locale-aware path for a given route path.
 * - path must start and end with '/'
 * - English lives at root
 */
export function localePath(locale: string, path: string): string {
  if (!path.startsWith('/')) throw new Error('path must start with "/"');
  // Normalize trailing slash for consistency
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  return locale === 'en' ? normalizedPath : `/${locale}${normalizedPath}`;
}

export function canonicalUrl(locale: string, path: string): string {
  return `${BASE_URL}${localePath(locale, path)}`;
}

export function hreflangLanguages(
  supportedLocales: readonly string[],
  path: string
): Record<string, string> {
  const map = Object.fromEntries(
    supportedLocales.map((l) => [l, localePath(l, path)])
  );
  // x-default should point to the English variant under the root
  (map as Record<string, string>)['x-default'] = localePath('en', path);
  return map;
}

/** Convenience builder for Next.js metadata.alternates */
export function buildAlternates(
  locale: string,
  path: string,
  supportedLocales: readonly string[]
) {
  return {
    canonical: canonicalUrl(locale, path),
    languages: hreflangLanguages(supportedLocales, path),
  } as const;
}

/** Map app locales to Open Graph locale codes (BCP47-ish with region). */
export function ogLocaleFromAppLocale(locale: string): string {
  switch (locale) {
    case 'en':
      return 'en_US';
    case 'de':
      return 'de_DE';
    case 'fr':
      return 'fr_FR';
    case 'es':
      return 'es_ES';
    case 'ru':
      return 'ru_RU';
    case 'ja':
      return 'ja_JP';
    case 'ar':
      return 'ar_AE';
    case 'hi':
      return 'hi_IN';
    case 'zh':
      // Default to Simplified Chinese for Mainland China unless specified otherwise
      return 'zh_CN';
    default:
      // Fallback to English (US) to ensure valid OG locale
      return 'en_US';
  }
}

/** Build list of alternate OG locales excluding the current one. */
export function ogAlternateLocales(
  supportedLocales: readonly string[],
  currentLocale: string
): string[] {
  return supportedLocales
    .filter((l) => l !== currentLocale)
    .map((l) => ogLocaleFromAppLocale(l));
}
