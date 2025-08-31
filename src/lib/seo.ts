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


