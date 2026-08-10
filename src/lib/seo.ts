export const BASE_URL = 'https://myaiphotoshoot.com';
const META_DESCRIPTION_MAX_LENGTH = 160;
const META_DESCRIPTION_MIN_BOUNDARY = 120;

export function buildMetaDescription(value: unknown, fallback: string): string {
  const source = typeof value === 'string' && value.trim() ? value : fallback;
  const normalized = source.replace(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);
  if (characters.length <= META_DESCRIPTION_MAX_LENGTH) return normalized;

  const candidate = characters.slice(0, META_DESCRIPTION_MAX_LENGTH - 1).join('').trimEnd();
  const sentenceBoundary = Math.max(
    candidate.lastIndexOf('.'),
    candidate.lastIndexOf('!'),
    candidate.lastIndexOf('?'),
    candidate.lastIndexOf('。'),
    candidate.lastIndexOf('！'),
    candidate.lastIndexOf('？'),
  );
  if (sentenceBoundary >= META_DESCRIPTION_MIN_BOUNDARY) {
    return candidate.slice(0, sentenceBoundary + 1).trimEnd();
  }

  const wordBoundary = candidate.lastIndexOf(' ');
  const concise = wordBoundary >= META_DESCRIPTION_MIN_BOUNDARY
    ? candidate.slice(0, wordBoundary)
    : candidate;
  return `${concise.trimEnd()}…`;
}

/** Returns a locale-aware path for a given route path.
 * - path must start with '/'
 * - English lives at root
 */
export function localePath(locale: string, path: string): string {
  if (!path.startsWith('/')) throw new Error('path must start with "/"');
  // Normalize trailing slash for consistency
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  if (locale === 'en') {
    return normalizedPath;
  }
  // Avoid double slashes when prefixing locale
  return normalizedPath === '/' ? `/${locale}/` : `/${locale}${normalizedPath}`;
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
