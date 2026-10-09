const DEFAULT_FUNCTIONS_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';

const LOCALE_COUNTRY_FALLBACKS = Object.freeze({
  ar: 'SA',
  de: 'DE',
  en: 'US',
  es: 'ES',
  fr: 'FR',
  hi: 'IN',
  ja: 'JP',
  ru: 'RU',
  zh: 'CN',
});

const NO_STORE_HEADERS = Object.freeze({
  'cache-control': 'no-store, max-age=0',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
});

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET') {
    return json({ error: 'Method Not Allowed' }, 405, { allow: 'GET' });
  }

  const requestUrl = new URL(request.url);
  const countryCode = resolvePricingCountry(
    request?.cf?.country,
    requestUrl.searchParams.get('locale'),
  );
  const pricingUrl = new URL(`${DEFAULT_FUNCTIONS_URL}/stripe-pricing`);
  pricingUrl.searchParams.set('country_code', countryCode);

  try {
    // Fetch here so the version header selects V2; a redirect cannot add it.
    const response = await fetch(pricingUrl, {
      headers: { 'x-app-version': '1.13.0', accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Pricing upstream returned ${response.status}`);
    return json(await response.json(), 200);
  } catch (error) {
    console.error('Unable to load V2 pricing', error);
    return json({ error: 'Pricing is temporarily unavailable.' }, 502);
  }
}

export function resolvePricingCountry(country, locale) {
  const normalizedCountry = normalizedCountryCode(country);
  if (normalizedCountry) return normalizedCountry;

  const normalizedLocale = typeof locale === 'string'
    ? locale.trim().toLowerCase().split(/[-_]/, 1)[0]
    : '';
  return LOCALE_COUNTRY_FALLBACKS[normalizedLocale] || 'US';
}

function normalizedCountryCode(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized) || normalized === 'XX' || normalized === 'T1') {
    return null;
  }
  return normalized;
}

function json(value, status, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...NO_STORE_HEADERS, ...extraHeaders },
  });
}
