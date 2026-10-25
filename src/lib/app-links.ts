export const WEB_APP_URL = 'https://app.myaiphotoshoot.com';
export const WEB_APP_IDEAS_URL = `${WEB_APP_URL}/#ideas`;
export const WEB_APP_STUDIO_URL = `${WEB_APP_URL}/#generate`;
const APP_STORE_ID = '6744860178';
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const GOOGLE_PLAY_APP_URL =
  'https://play.google.com/store/apps/details?id=com.myaiphotoshoot';
export const GOOGLE_PLAY_URL =
  `${GOOGLE_PLAY_APP_URL}&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1`;
export const AI_MASKS_APP_URL = `${WEB_APP_URL}/#masks`;

export type MaskLinkGender = 'female' | 'male';
const maskIdentifierPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildMaskAppUrl(maskId: string, gender?: MaskLinkGender): string {
  const suffix = gender ? `/gender/${gender}` : '';
  return `${AI_MASKS_APP_URL}/${encodeURIComponent(maskId)}${suffix}`;
}

export function buildMaskNativeAppUrl(maskId: string | undefined, locale: string, gender?: MaskLinkGender): string {
  if (maskId !== undefined && !maskIdentifierPattern.test(maskId)) {
    throw new Error('Invalid mask identifier');
  }
  const url = new URL(`/open/mask/${encodeURIComponent(maskId ?? 'all')}/`, WEB_APP_URL);
  url.searchParams.set('locale', locale);
  if (maskId && gender) url.searchParams.set('gender', gender);
  return url.toString();
}

const presetIdentifierPattern = /^[A-Za-z0-9_-]{1,160}(?:~[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})?$/i;

function presetAppIdentifier(webAppUrl: string): string {
  const url = new URL(webAppUrl);
  if (url.origin !== WEB_APP_URL || url.pathname !== '/' || !url.hash.startsWith('#preset/')) {
    throw new Error('Expected a web preset URL');
  }
  const identifier = decodeURIComponent(url.hash.slice('#preset/'.length));
  if (!presetIdentifierPattern.test(identifier)) throw new Error('Invalid preset identifier');
  return identifier;
}

export function androidInstallSelection(parameters: URLSearchParams): URLSearchParams {
  const presets = parameters.getAll('preset');
  const masks = parameters.getAll('mask');
  const genders = parameters.getAll('gender');
  if (presets.length === 1 && masks.length === 0 && genders.length === 0 && presetIdentifierPattern.test(presets[0])) {
    return new URLSearchParams({ preset: presets[0] });
  }
  if (presets.length === 0 && masks.length === 1 && (masks[0] === 'all' || maskIdentifierPattern.test(masks[0])) &&
      (genders.length === 0 || (genders.length === 1 && masks[0] !== 'all' && /^(female|male)$/i.test(genders[0])))) {
    const selection = new URLSearchParams({ mask: masks[0] });
    if (genders.length) selection.set('gender', genders[0].toLowerCase());
    return selection;
  }
  return new URLSearchParams();
}

export function buildPresetGooglePlayUrl(webAppUrl: string): string {
  const url = new URL(GOOGLE_PLAY_URL);
  url.searchParams.set('referrer', new URLSearchParams({ preset: presetAppIdentifier(webAppUrl) }).toString());
  return url.toString();
}

export function buildMaskGooglePlayUrl(maskId?: string, gender?: MaskLinkGender): string {
  const parameters = new URLSearchParams({ mask: maskId ?? 'all' });
  if (maskId && gender) parameters.set('gender', gender);
  const selection = androidInstallSelection(parameters);
  if (!selection.has('mask')) throw new Error('Invalid mask install selection');
  const url = new URL(GOOGLE_PLAY_URL);
  url.searchParams.set('referrer', selection.toString());
  return url.toString();
}

export function buildPresetNativeAppUrl(webAppUrl: string, locale: string): string {
  const url = new URL(`/open/preset/${encodeURIComponent(presetAppIdentifier(webAppUrl))}/`, WEB_APP_URL);
  url.searchParams.set('locale', locale);
  return url.toString();
}

export function buildNativeAppOpenUrl(nativeAppUrl: string, platform: 'ios' | 'android' | null, googlePlayUrl: string): string {
  if (platform !== 'android') return nativeAppUrl;
  const url = new URL(nativeAppUrl);
  if (url.origin !== WEB_APP_URL || !/^\/open\/(preset|mask)\/[^/]+\/$/.test(url.pathname) || url.hash) {
    throw new Error('Expected a native app URL');
  }
  const fallback = new URL(googlePlayUrl);
  if (fallback.origin !== 'https://play.google.com' || fallback.pathname !== '/store/apps/details' ||
      fallback.searchParams.getAll('id').length !== 1 || fallback.searchParams.get('id') !== 'com.myaiphotoshoot') {
    throw new Error('Expected the app Google Play URL');
  }
  // Launch the app on the tap, or go straight to Play without loading our fallback page.
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.myaiphotoshoot;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`;
}

export function buildPresetMarketingUrl(webAppUrl: string, locale: string): string {
  const [slug, assignmentId] = presetAppIdentifier(webAppUrl).split('~');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const url = new URL(`${prefix}/presets/${encodeURIComponent(slug)}/`, 'https://myaiphotoshoot.com');
  if (assignmentId) url.searchParams.set('assignment_id', assignmentId);
  return url.toString();
}

export function smartAppBanner(url: string): string {
  return `app-id=${APP_STORE_ID}, app-argument=${url}`;
}

export function mobileAppPlatform(userAgent: string, maxTouchPoints: number): 'ios' | 'android' | null {
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  return /android/i.test(userAgent) ? 'android' : null;
}
