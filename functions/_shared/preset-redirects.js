const PRESET_SLUG_ALIASES = new Map([
  ['quiet-photo-restore', 'old-photo-restore'],
  ['ai-yearbook', 'yearbook'],
]);

export function redirectLegacyPresetRequest(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;

  const url = new URL(request.url);
  const route = url.pathname.match(/^\/(?:(en|zh|hi|es|de|ja|ru|fr|ar)\/)?presets\/([^/]+)\/?$/);
  if (!route) return null;

  const [, locale, legacySlug] = route;
  const canonicalSlug = PRESET_SLUG_ALIASES.get(legacySlug);
  if (!canonicalSlug) return null;

  const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
  url.pathname = `${localePrefix}/presets/${canonicalSlug}/`;
  return new Response(null, {
    status: 308,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
